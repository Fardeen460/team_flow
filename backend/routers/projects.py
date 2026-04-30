from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
import models, schemas
from core.auth import get_current_user

router = APIRouter(prefix="/api/projects", tags=["projects"])


def _enrich_project(project: models.Project, db: Session) -> dict:
    task_count = len(project.tasks)
    completed = sum(1 for t in project.tasks if t.status == models.TaskStatus.done)
    p = schemas.ProjectOut.model_validate(project)
    p.task_count = task_count
    p.completed_count = completed
    return p


def _check_project_access(project_id: int, user: models.User, db: Session, require_owner: bool = False):
    project = db.query(models.Project).filter(
        models.Project.id == project_id,
        models.Project.is_active == True,
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    is_owner = project.owner_id == user.id
    is_admin = user.role == "admin"
    is_member = user in project.members or is_owner

    if require_owner and not (is_owner or is_admin):
        raise HTTPException(status_code=403, detail="Only project owner or admin can do this")
    if not require_owner and not (is_member or is_admin):
        raise HTTPException(status_code=403, detail="Access denied")

    return project


@router.get("/", response_model=List[schemas.ProjectOut])
def list_projects(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role == "admin":
        projects = db.query(models.Project).filter(models.Project.is_active == True).all()
    else:
        owned = db.query(models.Project).filter(
            models.Project.owner_id == current_user.id,
            models.Project.is_active == True,
        ).all()
        member_of = current_user.member_projects
        seen = {p.id for p in owned}
        all_projects = list(owned)
        for p in member_of:
            if p.id not in seen and p.is_active:
                all_projects.append(p)
                seen.add(p.id)
        projects = all_projects

    return [_enrich_project(p, db) for p in projects]


@router.post("/", response_model=schemas.ProjectOut, status_code=201)
def create_project(
    data: schemas.ProjectCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    project = models.Project(
        name=data.name,
        description=data.description,
        color=data.color or "#6366f1",
        owner_id=current_user.id,
    )
    project.members.append(current_user)
    db.add(project)
    db.commit()
    db.refresh(project)
    return _enrich_project(project, db)


@router.get("/{project_id}", response_model=schemas.ProjectOut)
def get_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    project = _check_project_access(project_id, current_user, db)
    return _enrich_project(project, db)


@router.patch("/{project_id}", response_model=schemas.ProjectOut)
def update_project(
    project_id: int,
    data: schemas.ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    project = _check_project_access(project_id, current_user, db, require_owner=True)
    if data.name is not None:
        project.name = data.name
    if data.description is not None:
        project.description = data.description
    if data.color is not None:
        project.color = data.color
    db.commit()
    db.refresh(project)
    return _enrich_project(project, db)


@router.delete("/{project_id}")
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    project = _check_project_access(project_id, current_user, db, require_owner=True)
    project.is_active = False
    db.commit()
    return {"message": "Project deleted"}


@router.post("/{project_id}/members", response_model=schemas.ProjectOut)
def add_member(
    project_id: int,
    data: schemas.ProjectMemberAdd,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    project = _check_project_access(project_id, current_user, db, require_owner=True)
    user = db.query(models.User).filter(models.User.id == data.user_id, models.User.is_active == True).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user in project.members:
        raise HTTPException(status_code=400, detail="User is already a member")
    project.members.append(user)
    db.commit()
    db.refresh(project)
    return _enrich_project(project, db)


@router.delete("/{project_id}/members/{user_id}", response_model=schemas.ProjectOut)
def remove_member(
    project_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    project = _check_project_access(project_id, current_user, db, require_owner=True)
    if user_id == project.owner_id:
        raise HTTPException(status_code=400, detail="Cannot remove project owner")
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user or user not in project.members:
        raise HTTPException(status_code=404, detail="Member not found")
    project.members.remove(user)
    db.commit()
    db.refresh(project)
    return _enrich_project(project, db)
