from __future__ import annotations

import uuid
from datetime import datetime
from enum import Enum

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    JSON,
    String,
    Text,
    func,
)
from sqlalchemy import (
    Enum as SqlEnum,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class NotificationStatus(str, Enum):
    PENDING = "pending"
    SENT = "sent"
    FAILED = "failed"
    READ = "read"


class NotificationPriority(str, Enum):
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    URGENT = "urgent"


class NotificationChannel(str, Enum):
    DATABASE = "database"
    EMAIL = "email"
    WEBSOCKET = "websocket"


class NotificationType(str, Enum):
    APPLICATION = "application"
    APPLICATION_ACCEPTED = "application_accepted"
    APPLICATION_REJECTED = "application_rejected"
    PROJECT_INVITE = "project_invite"
    PROJECT_UPDATE = "project_update"
    MESSAGE = "message"
    FOLLOW = "follow"
    MENTION = "mention"
    BUILDER_FLARE = "builder_flare"
    SYSTEM = "system"
    AI = "ai"
    # New types from prompt
    WELCOME = "welcome"
    PASSWORD_RESET = "password_reset"
    ROLE_CHANGE = "role_change"
    SECURITY_ALERT = "security_alert"


class NotificationPreference(Base):
    """
    User notification preferences for different channels and types.
    """

    __tablename__ = "notification_preferences"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )

    # Global Channel Toggles
    email_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    websocket_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    database_enabled: Mapped[bool] = mapped_column(Boolean, default=True)

    # Core Event Categories (#586)
    messages: Mapped[bool] = mapped_column(Boolean, default=True)
    team_invitations: Mapped[bool] = mapped_column(Boolean, default=True)
    project_updates: Mapped[bool] = mapped_column(Boolean, default=True)
    mentions: Mapped[bool] = mapped_column(Boolean, default=True)
    system_announcements: Mapped[bool] = mapped_column(Boolean, default=True)

    # Per-Category Email Delivery Preferences
    email_messages: Mapped[bool] = mapped_column(Boolean, default=True)
    email_team_invitations: Mapped[bool] = mapped_column(Boolean, default=True)
    email_project_updates: Mapped[bool] = mapped_column(Boolean, default=True)
    email_mentions: Mapped[bool] = mapped_column(Boolean, default=True)
    email_system_announcements: Mapped[bool] = mapped_column(Boolean, default=True)

    # Legacy & Auxiliary Toggles
    invitations: Mapped[bool] = mapped_column(Boolean, default=True)
    role_changes: Mapped[bool] = mapped_column(Boolean, default=True)
    marketing_emails: Mapped[bool] = mapped_column(Boolean, default=False)
    system_alerts: Mapped[bool] = mapped_column(Boolean, default=True)

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    user = relationship("User", backref="notification_preferences")


class Notification(Base):
    """
    User notification.
    """

    __tablename__ = "notifications"

    # ==========================================================
    # Primary Key
    # ==========================================================

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    # ==========================================================
    # User
    # ==========================================================

    recipient_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    sender_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    # ==========================================================
    # Notification
    # ==========================================================

    type: Mapped[NotificationType] = mapped_column(
        SqlEnum(NotificationType),
        nullable=False,
        index=True,
    )

    channel: Mapped[NotificationChannel] = mapped_column(
        SqlEnum(NotificationChannel),
        nullable=False,
        default=NotificationChannel.DATABASE,
    )

    status: Mapped[NotificationStatus] = mapped_column(
        SqlEnum(NotificationStatus),
        nullable=False,
        default=NotificationStatus.PENDING,
        index=True,
    )

    priority: Mapped[NotificationPriority] = mapped_column(
        SqlEnum(NotificationPriority),
        nullable=False,
        default=NotificationPriority.NORMAL,
        index=True,
    )

    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    message: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    action_url: Mapped[str | None] = mapped_column(
        String(500),
    )

    image_url: Mapped[str | None] = mapped_column(
        String(500),
    )

    # Metadata for additional data (like payload)
    metadata_info: Mapped[dict | None] = mapped_column(
        JSONB().with_variant(JSON, "sqlite"),
        default=dict,
    )  # ==========================================================
    # Related Resources (Legacy, consider moving to metadata_info)
    # ==========================================================

    project_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("projects.id", ondelete="SET NULL"),
        index=True,
    )

    conversation_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("conversations.id", ondelete="SET NULL"),
        index=True,
    )

    message_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("messages.id", ondelete="SET NULL"),
        index=True,
    )

    application_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("applications.id", ondelete="SET NULL"),
        index=True,
    )

    # ==========================================================
    # Status
    # ==========================================================

    is_read: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        index=True,
    )

    read_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        index=True,
    )

    delivered_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        index=True,
    )

    clicked_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        index=True,
    )

    sent_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
    )

    scheduled_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
    )

    # ==========================================================
    # Relationships
    # ==========================================================

    recipient = relationship(
        "User",
        foreign_keys=[recipient_id],
        backref="notifications",
    )

    sender = relationship(
        "User",
        foreign_keys=[sender_id],
    )

    project = relationship(
        "Project",
        backref="notifications",
    )

    conversation = relationship(
        "Conversation",
        backref="notifications",
    )

    chat_message = relationship(
        "Message",
        backref="notifications",
    )

    application = relationship(
        "Application",
        backref="notifications",
    )

    # ==========================================================
    # Audit
    # ==========================================================

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    def __repr__(self) -> str:
        return f"<Notification(type='{self.type.value}', recipient={self.recipient_id}, status={self.status})>"
