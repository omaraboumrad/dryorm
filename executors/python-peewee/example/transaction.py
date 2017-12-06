from models import *

def execute():
    Artist.create(name="Newsboys")

    artist = Artist.select().get()

    print(artist.name)
