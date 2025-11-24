"""
Example SQLAlchemy code for DryORM executor
This demonstrates a simple blog schema with users and posts
"""
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy import String, Integer, ForeignKey, Text

# Define Base class
class Base(DeclarativeBase):
    pass

# Define User model
class User(Base):
    __tablename__ = 'users'

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(50))
    email: Mapped[str] = mapped_column(String(100), unique=True)

    posts: Mapped[list["Post"]] = relationship(back_populates="author")

    def __repr__(self):
        return f"<User(name={self.name}, email={self.email})>"

# Define Post model
class Post(Base):
    __tablename__ = 'posts'

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(200))
    content: Mapped[str] = mapped_column(Text)
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id'))

    author: Mapped["User"] = relationship(back_populates="posts")

    def __repr__(self):
        return f"<Post(title={self.title})>"

# Run function - executed automatically by the executor
def run():
    # Create a session
    session = Session()

    # Create users
    user1 = User(name="Alice Johnson", email="alice@example.com")
    user2 = User(name="Bob Smith", email="bob@example.com")

    session.add_all([user1, user2])
    session.commit()

    # Create posts
    post1 = Post(
        title="Getting Started with SQLAlchemy",
        content="SQLAlchemy is a powerful Python SQL toolkit...",
        user_id=user1.id
    )
    post2 = Post(
        title="Database Relationships Explained",
        content="Understanding foreign keys and relationships...",
        user_id=user1.id
    )
    post3 = Post(
        title="Advanced Query Techniques",
        content="Learn how to write complex queries...",
        user_id=user2.id
    )

    session.add_all([post1, post2, post3])
    session.commit()

    # Query and display data
    print("All Users:")
    users = session.query(User).all()
    for user in users:
        print(f"  {user.name} ({user.email})")
        print(f"    Posts: {len(user.posts)}")

    print("\nAll Posts:")
    posts = session.query(Post).all()
    for post in posts:
        print(f"  '{post.title}' by {post.author.name}")

    # Example of filtering
    print("\nPosts by Alice:")
    alice_posts = session.query(Post).join(User).filter(User.name == "Alice Johnson").all()
    for post in alice_posts:
        print(f"  - {post.title}")

    session.close()
    return f"Created {len(users)} users and {len(posts)} posts"
