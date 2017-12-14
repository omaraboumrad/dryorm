from sqlalchemy.orm import sessionmaker

from models import *


def execute(engine):
    DBSession = sessionmaker(bind=engine)
    session = DBSession()

    person = Person(name='new person')
    session.add(new_person)

    address = Address(post_code='00000', person=new_person)
    session.add(new_address)
    session.commit()
