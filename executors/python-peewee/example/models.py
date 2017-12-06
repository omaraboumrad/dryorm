import peewee

database = peewee.SqliteDatabase("db.sqlite3")

class Artist(peewee.Model):

    name = peewee.CharField()

    class Meta:
        database = database

def init():
    Artist.create_table()
