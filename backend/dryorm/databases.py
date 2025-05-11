from dataclasses import dataclass

import os
import subprocess
import uuid


@dataclass
class Database:
    key: str
    description: str
    needs_setup: bool = False

    host: str = ''
    port: int = 0
    user: str = ''
    password: str = ''
    script: str = ''

    def setup(self):
        raise NotImplementedError("Database setup not implemented")

    def teardown(self, unique_name):
        raise NotImplementedError("Database teardown not implemented")


class SQLite(Database):
    def __init__(self):
        super().__init__(
            key='sqlite',
            description='SQLite',
            needs_setup=False,
        )


class PostgreSQL(Database):
    def __init__(self):
        super().__init__(
            key='postgres',
            description='PostgreSQL 17.4',
            needs_setup=True,
            host='database_postgres',
            port=5432,
            user='dryorm',
            password='dryorm',
            script='scripts/postgres_create.sh',
        )

    def setup(self):
        random_hash = uuid.uuid4().hex[:6]
        unique_name = f'{self.key}-{random_hash}'
        subprocess.run([
            self.script,
            self.host,
            str(self.port),
            self.user,
            self.password,
            unique_name,
            unique_name,
            unique_name,
        ])
        return unique_name

    def teardown(self, unique_name):
        subprocess.run([
            'psql',
            '-h', self.host,
            '-p', str(self.port),
            '-U', self.user,
            '-c', f'DROP DATABASE "{unique_name}";'
        ], env={**os.environ, 'PGPASSWORD': self.password})


class MariaDB(Database):
    def __init__(self):
        super().__init__(
            key='mariadb',
            description='MariaDB 11.4.5',
            needs_setup=True,
            host='database_mariadb',
            port=3306,
            user='dryorm',
            password='dryorm',
            script='scripts/mariadb_create.sh',
        )

    def setup(self):
        random_hash = uuid.uuid4().hex[:6]
        unique_name = f'{self.key}-{random_hash}'
        subprocess.run([
            self.script,
            self.host,
            str(self.port),
            self.user,
            self.password,
            unique_name,
            unique_name,
            unique_name,
        ])
        return unique_name

    def teardown(self, unique_name):
        subprocess.run([
            'mysql',
            '-h', self.host,
            '-P', str(self.port),
            '-u', self.user,
            f'-p{self.password}',
            '-e', f'DROP DATABASE IF EXISTS `{unique_name}`; DROP USER IF EXISTS `{unique_name}`@`%`;'
        ])


DATABASES = {
    'sqlite': SQLite(),
    'postgres': PostgreSQL(),
    'mariadb': MariaDB(),
}
