import peewee

from models import Artist

Artist.create(name="Newsboys")

artist = Artist.select().get()

print(artist.name)
