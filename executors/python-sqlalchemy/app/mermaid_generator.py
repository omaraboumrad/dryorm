"""
Mermaid ERD generator for SQLAlchemy models
"""
from typing import Optional, Set, List, Dict
from sqlalchemy import inspect
from sqlalchemy.engine import Engine
from sqlalchemy.orm import DeclarativeBase


def generate_mermaid_erd(engine: Engine, base_class: Optional[type] = None) -> str:
    """
    Generate a Mermaid ERD diagram from SQLAlchemy models

    Args:
        engine: SQLAlchemy engine
        base_class: DeclarativeBase subclass containing models

    Returns:
        Mermaid ERD diagram as string
    """
    if not base_class:
        return "erDiagram\n"

    inspector = inspect(engine)
    mermaid_lines = ["erDiagram"]
    relationships_added: Set[str] = set()

    # Get all model classes from the Base
    models = []
    for name, obj in base_class.registry._class_registry.items():
        if name != '_sa_module_registry' and hasattr(obj, '__tablename__'):
            models.append(obj)

    # Generate entity definitions
    for model in models:
        table_name = model.__tablename__
        mapper = inspect(model)

        # Add table definition
        mermaid_lines.append(f"  {table_name} {{")

        # Add columns
        for column in mapper.columns:
            col_name = column.name
            col_type = str(column.type)

            # Simplify type names
            if '(' in col_type:
                col_type = col_type.split('(')[0]

            # Add constraints
            constraints = []
            if column.primary_key:
                constraints.append("PK")
            if column.foreign_keys:
                constraints.append("FK")
            if not column.nullable and not column.primary_key:
                constraints.append("NOT NULL")
            if column.unique:
                constraints.append("UNIQUE")

            constraint_str = f" \"{', '.join(constraints)}\"" if constraints else ""
            mermaid_lines.append(f"    {col_type} {col_name}{constraint_str}")

        mermaid_lines.append("  }")

    # Generate relationships
    for model in models:
        table_name = model.__tablename__
        mapper = inspect(model)

        # Process relationships
        for relationship_prop in mapper.relationships:
            related_model = relationship_prop.mapper.class_
            related_table = related_model.__tablename__

            # Determine relationship type
            if relationship_prop.uselist:
                # One-to-many or many-to-many
                if relationship_prop.secondary is not None:
                    # Many-to-many
                    rel_type = "}o--o{"
                else:
                    # One-to-many
                    rel_type = "||--o{"
            else:
                # One-to-one or many-to-one
                if any(col.unique for col in relationship_prop.local_columns):
                    # One-to-one
                    rel_type = "||--||"
                else:
                    # Many-to-one
                    rel_type = "}o--||"

            # Create relationship string (avoid duplicates)
            rel_str = f"  {table_name} {rel_type} {related_table} : \"{relationship_prop.key}\""
            rel_reverse = f"  {related_table} {rel_type.replace('||', '??').replace('}o', '??').replace('o{', '??')} {table_name}"

            # Add relationship if not already added (in either direction)
            if rel_str not in relationships_added and rel_reverse not in relationships_added:
                mermaid_lines.append(rel_str)
                relationships_added.add(rel_str)

    return "\n".join(mermaid_lines)
