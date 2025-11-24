DRYORM_FEATURES = """from django.db import models

# Tabulate and Faker are available.
from tabulate import tabulate
from faker import Faker

# You can place the models here
class Person(models.Model):
    name = models.CharField(max_length=100)

# You need a run function
def run():
    # At this point all migrations are created and applied
    john = Person.objects.create(name='John Doe')
    jane = Person.objects.create(name='Jane Doe')

    # Any "print" statements will be displayed in "Output"
    print(f'Hello, {john.name}!')

    # If you return a Dict[str, List[Dict[str, Any]]], it will be displayed
    # as a Table below the Output Section and will be given the key as title.
    return {
        'People': list(Person.objects.values()),
        'Other': [
            {'name': 'Cell 1', 'other': 'Cell 2'},
            {'name': 'Cell 3', 'other': 'Cell 4'},
        ]
    }

    # Alternatively, you can just return a list of dicts
    # to render a default "Data" table.
    # return list(Person.objects.all().values())
"""

BASIC = """from django.db import models

class Person(models.Model):
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name

def run():
    instance = Person.objects.create(name='John Doe')
    print(f'Created: {instance}')
"""

BULK = """from django.db import models
from django.db import models

class Person(models.Model):
    name = models.CharField(max_length=100)

def run():
    Person.objects.bulk_create([
        Person(name='John Doe'),
        Person(name='Jane Doe'),
        Person(name='Jim Doe'),
    ])

    return list(Person.objects.all().values())
"""

BULK_FAKE = """from django.db import models
from tabulate import tabulate
from faker import Faker

class Person(models.Model):
    class Role(models.TextChoices):
        ADMIN = 'admin'
        USER = 'user'
        GUEST = 'guest'

    name = models.CharField(max_length=100)
    role = models.CharField(max_length=100, choices=Role.choices)

def run():
    fake = Faker()

    Person.objects.bulk_create([
        Person(name=fake.name(), role=fake.random_element(Person.Role.choices))
        for _ in range(100)
    ])

    print(tabulate(
        Person.objects.all().values('role').annotate(models.Count('id')),
        headers='keys',
        tablefmt='psql'
    ))
"""

CSV_IMPORT = '''\
import csv
from io import StringIO

from django.db import models
from tabulate import tabulate

class Person(models.Model):
    name = models.CharField(max_length=100)
    country = models.CharField(max_length=100)

data = """\
name,country
John Doe,USA
Jane Doe,Canada
Jim Doe,UK
"""

def run():
    reader = csv.DictReader(StringIO(data))
    Person.objects.bulk_create([
        Person(**row) for row in reader
    ])

    print(tabulate(
        Person.objects.values(),
        headers='keys',
        tablefmt='psql'
    ))
'''

BASIC_FK = """from django.db import models

class Category(models.Model):
    name = models.CharField(max_length=100)

class Product(models.Model):
    name = models.CharField(max_length=100)
    category = models.ForeignKey(Category, on_delete=models.CASCADE)

def run():
    electronics = Category.objects.create(name='Electronics')
    clothing = Category.objects.create(name='Clothing')

    Product.objects.create(name='Laptop', category=electronics)
    Product.objects.create(name='T-Shirt', category=clothing)
    Product.objects.create(name='Smartphone', category=electronics)
    Product.objects.create(name='Jeans', category=clothing)
    Product.objects.create(name='Headphones', category=electronics)

    print('Products per category:')
    for category in Category.objects.prefetch_related('product_set'):
        print(f'{category.name}: {category.product_set.count()} products')
"""

SELF_FK = """from django.db import models

class Employee(models.Model):
    name = models.CharField(max_length=100)
    manager = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True)

    def __str__(self):
        return self.name

def run():
    alice = Employee.objects.create(name='Alice')
    bob = Employee.objects.create(name='Bob', manager=alice)
    charlie = Employee.objects.create(name='Charlie', manager=bob)

    print('Employees and their managers:')
    for employee in Employee.objects.select_related('manager'):
        manager_name = employee.manager.name if employee.manager else 'None'
        print(f'{employee.name} -> {manager_name}')
"""

USER_PROFILE = """from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    bio = models.TextField()

    def __str__(self):
        return f'{self.user.username} Profile'

def run():
    user = User.objects.create_user(username='john.doe', password='password')
    profile = UserProfile.objects.create(user=user, bio='Hello, I am John Doe!')

    print(f'User: {user.username}, Profile: {profile.bio}')
"""

TABULAR_OUTPUT = """from django.db import models
from django.db import models

class Person(models.Model):
    name = models.CharField(max_length=100)

def run():
    Person.objects.bulk_create([
        Person(name='John Doe'),
        Person(name='John Smith'),
        Person(name='Jane Doe'),
        Person(name='Jane Smith'),
    ])

    return {
        'The Does': list(Person.objects.filter(name__endswith='Doe').values()),
        'The Smiths': list(Person.objects.filter(name__endswith='Smith').values()),
    }
"""


# SQLAlchemy Templates
SQLALCHEMY_BASIC = """from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import String

class Base(DeclarativeBase):
    pass

class Person(Base):
    __tablename__ = 'person'

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))

    def __repr__(self):
        return f"<Person(name={self.name})>"

def run():
    session = Session()

    person = Person(name='John Doe')
    session.add(person)
    session.commit()

    print(f'Created: {person}')

    session.close()
"""

SQLALCHEMY_BASIC_FK = """from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy import String, ForeignKey

class Base(DeclarativeBase):
    pass

class Category(Base):
    __tablename__ = 'category'

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))

    products: Mapped[list["Product"]] = relationship(back_populates="category")

class Product(Base):
    __tablename__ = 'product'

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    category_id: Mapped[int] = mapped_column(ForeignKey('category.id'))

    category: Mapped["Category"] = relationship(back_populates="products")

def run():
    session = Session()

    electronics = Category(name='Electronics')
    clothing = Category(name='Clothing')
    session.add_all([electronics, clothing])
    session.commit()

    products = [
        Product(name='Laptop', category_id=electronics.id),
        Product(name='T-Shirt', category_id=clothing.id),
        Product(name='Smartphone', category_id=electronics.id),
    ]
    session.add_all(products)
    session.commit()

    print('Products per category:')
    categories = session.query(Category).all()
    for category in categories:
        print(f'{category.name}: {len(category.products)} products')

    session.close()
"""

SQLALCHEMY_QUERY = """from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import String, select

class Base(DeclarativeBase):
    pass

class Person(Base):
    __tablename__ = 'person'

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    country: Mapped[str] = mapped_column(String(100))

def run():
    session = Session()

    # Add people
    people = [
        Person(name='John Doe', country='USA'),
        Person(name='Jane Doe', country='Canada'),
        Person(name='Jim Doe', country='UK'),
        Person(name='Alice Smith', country='USA'),
    ]
    session.add_all(people)
    session.commit()

    # Query examples
    print('All people from USA:')
    stmt = select(Person).where(Person.country == 'USA')
    usa_people = session.execute(stmt).scalars().all()
    for person in usa_people:
        print(f'  {person.name}')

    print(f'\\nTotal people: {session.query(Person).count()}')

    session.close()

    # Return data for table display
    return {
        'All People': [{'id': p.id, 'name': p.name, 'country': p.country} for p in people]
    }
"""

TEMPLATES = {
    "dryorm features": DRYORM_FEATURES,
    "basic": BASIC,
    "bulk create": BULK,
    "bulk fake": BULK_FAKE,
    "csv import": CSV_IMPORT,
    "basic fk": BASIC_FK,
    "self fk": SELF_FK,
    "user profile": USER_PROFILE,
    "dryorm tabular output": TABULAR_OUTPUT,
    "sqlalchemy basic": SQLALCHEMY_BASIC,
    "sqlalchemy basic fk": SQLALCHEMY_BASIC_FK,
    "sqlalchemy query": SQLALCHEMY_QUERY,
}
