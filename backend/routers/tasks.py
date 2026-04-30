from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List, Optional
from datetime import datetime, timezone
from database import get_db
import models, schemas
from core.auth import get_current_user

router = APIRouter(prefix="/api/tasks", tags=["tasks"])


def _check_project_membership(project_id: int, user: models.User, db: Session):
    project = db.query(models.Project).filter(
        models.Project.id == project_id,
        models.Project.is_active == True,
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    is_member = user in project.members or project.owner_id == user.id or user.role == "admin"
    if not is_member:
        raise HTTPException(status_code=403, detail="Not a project member")
    return project


@router.get("/", response_model=List[schemas.TaskOut])
def list_tasks(
    project_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    assignee_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    query = db.query(models.Task)

    if current_user.role != "admin":
        # Only tasks from projects user is member of
        accessible_project_ids = [p.id for p in current_user.member_projects] + \
                                  [p.id for p in current_user.owned_projects]
        query = query.filter(models.Task.project_id.in_(accessible_project_ids))

    if project_id:
        query = query.filter(models.Task.project_id == project_id)
    if status:
        query = query.filter(models.Task.status == status)
    if priority:
        query = query.filter(models.Task.priority == priority)
    if assignee_id:
        query = query.filter(models.Task.assignee_id == assignee_id)

    return query.order_by(models.Task.created_at.desc()).all()


@router.get("/my-tasks", response_model=List[schemas.TaskOut])
def my_tasks(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return db.query(models.Task).filter(
        models.Task.assignee_id == current_user.id
    ).order_by(models.Task.due_date.asc().nullslast()).all()


@router.get("/dashboard", response_model=schemas.DashboardStats)
def dashboard_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    now = datetime.now(timezone.utc)
    if current_user.role == "admin":
        project_ids = [p.id for p in db.query(models.Project).filter(models.Project.is_active == True).all()]
        total_projects = len(project_ids)
    else:
        owned = [p.id for p in current_user.owned_projects if p.is_active]
        member = [p.id for p in current_user.member_projects if p.is_active]
        project_ids = list(set(owned + member))
        total_projects = len(project_ids)

    tasks = db.query(models.Task).filter(models.Task.project_id.in_(project_ids)).all()
    total_tasks = len(tasks)
    completed = sum(1 for t in tasks if t.status == models.TaskStatus.done)
    in_progress = sum(1 for t in tasks if t.status == models.TaskStatus.in_progress)
    todo = sum(1 for t in tasks if t.status == models.TaskStatus.todo)
    overdue = sum(
        1 for t in tasks
        if t.due_date and t.due_date.replace(tzinfo=timezone.utc) < now and t.status != models.TaskStatus.done
    )

    return schemas.DashboardStats(
        total_projects=total_projects,
        total_tasks=total_tasks,
        completed_tasks=completed,
        overdue_tasks=overdue,
        in_progress_tasks=in_progress,
        todo_tasks=todo,
    )


@router.post("/{project_id}", response_model=schemas.TaskOut, status_code=201)
def create_task(
    project_id: int,
    data: schemas.TaskCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    project = _check_project_membership(project_id, current_user, db)

    if data.assignee_id:
        assignee = db.query(models.User).filter(models.User.id == data.assignee_id).first()
        if not assignee:
            raise HTTPException(status_code=404, detail="Assignee not found")

    task = models.Task(
        title=data.title,
        description=data.description,
        status=data.status,
        priority=data.priority,
        due_date=data.due_date,
        project_id=project_id,
        assignee_id=data.assignee_id,
        creator_id=current_user.id,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.get("/{task_id}", response_model=schemas.TaskOut)
def get_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    _check_project_membership(task.project_id, current_user, db)
    return task


@router.patch("/{task_id}", response_model=schemas.TaskOut)
def update_task(
    task_id: int,
    data: schemas.TaskUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    _check_project_membership(task.project_id, current_user, db)

    if data.title is not None:
        task.title = data.title
    if data.description is not None:
        task.description = data.description
    if data.status is not None:
        task.status = data.status
    if data.priority is not None:
        task.priority = data.priority
    if data.due_date is not None:
        task.due_date = data.due_date
    if data.assignee_id is not None:
        task.assignee_id = data.assignee_id

    db.commit()
    db.refresh(task)
    return task


@router.delete("/{task_id}")
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    project = _check_project_membership(task.project_id, current_user, db)
    is_creator = task.creator_id == current_user.id
    is_owner = project.owner_id == current_user.id
    is_admin = current_user.role == "admin"

    if not (is_creator or is_owner or is_admin):
        raise HTTPException(status_code=403, detail="Not authorized to delete this task")

    db.delete(task)
    db.commit()
    return {"message": "Task deleted"}
