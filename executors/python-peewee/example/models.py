import peewee


database = peewee.SqliteDatabase("db.sqlite3")


class Artist(peewee.Model):

    name = peewee.CharField()

    class Meta:
        database = database

if __name__ == '__main__':

    Artist.create_table()
