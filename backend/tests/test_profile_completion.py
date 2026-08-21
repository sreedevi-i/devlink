import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database.base import Base
from app.main import app
from app.dependencies import get_database, get_current_user
from app.models.user import User
from app.models.project import Project
from app.services.user_service import UserService

DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(name="db_session")
def fixture_db_session():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(name="test_client")
def fixture_test_client(db_session):
    mock_user = User(
        first_name="Jane",
        last_name="Completion",
        username="jane_comp",
        email="jane@devlink.io",
        is_active=True,
    )
    db_session.add(mock_user)
    db_session.commit()
    db_session.refresh(mock_user)

    def override_get_database():
        return db_session

    def override_get_current_user():
        return mock_user

    app.dependency_overrides[get_database] = override_get_database
    app.dependency_overrides[get_current_user] = override_get_current_user

    client = TestClient(app)
    yield client

    app.dependency_overrides.clear()


def test_partial_profile_completion(db_session):
    user = User(
        first_name="Partial",
        last_name="User",
        username="partial_u",
        email="partial@devlink.io",
        profile_image="https://example.com/avatar.png",
        bio="Full stack developer",
        role="Developer",
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()

    res = UserService.get_profile_completion(db_session, user)
    # Completed factors: Avatar, Bio, Experience (3 out of 8 = 38%)
    assert res.completion == 38
    assert "Avatar" in res.completed_factors
    assert "Bio" in res.completed_factors
    assert "Experience" in res.completed_factors
    assert "Banner" in res.missing
    assert "Projects" in res.missing
    assert res.reward_unlocked is False


def test_full_profile_completion_and_reward(db_session):
    user = User(
        first_name="Complete",
        last_name="User",
        username="complete_u",
        email="complete@devlink.io",
        profile_image="https://example.com/avatar.png",
        cover_image="https://example.com/banner.png",
        bio="Senior Engineer",
        role="Senior Developer",
        headline="B.S. Computer Science",
        github_url="https://github.com/complete",
        badges=["React"],
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()

    # Add a project for the user
    project = Project(
        owner_id=user.id,
        title="Sample Project",
        slug="sample-project",
        description="A great project",
    )
    db_session.add(project)
    db_session.commit()

    res = UserService.get_profile_completion(db_session, user)
    assert res.completion == 100
    assert len(res.missing) == 0
    assert res.reward_unlocked is True
    assert res.reward_badge == "Profile Master"

    # Verify badge is saved to user
    db_session.refresh(user)
    assert "Profile Master" in user.badges


def test_completion_api_endpoint(test_client, db_session):
    response = test_client.get("/api/users/me/completion")
    assert response.status_code == 200
    data = response.json()
    assert "completion" in data
    assert "missing" in data
    assert "completed_factors" in data
    assert "reward_unlocked" in data
