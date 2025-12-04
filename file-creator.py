import os

STRUCTURE = {
    "backend": {
        "__init__.py": "",
        "main.py": "",
        "requirements-dev.txt": "",
        "requirements-txt": "",
        "utils": {
            "__init__.py": "",
            "helpers.py": "",
        },
        "api": {
            "__init__.py": "",
        },
        "db": {
            "__init__.py": "",
        },
        "models": {
            "__init__.py": "",
        },
        "schemas": {
            "__init__.py": "",
        },
    },
    "tests": {
        "__init__.py": "",
    },
    "requirements.txt": "",
    "pyproject.toml": "",
    ".pre-commit-config.yaml": "",
    "README.md": "# Backend\n\nThis is the backend service.",
}


def create_structure(base_path, structure):
    for name, content in structure.items():
        path = os.path.join(base_path, name)
        if isinstance(content, dict):
            os.makedirs(path, exist_ok=True)
            create_structure(path, content)
        else:
            # Create file with content
            with open(path, "w") as f:
                f.write(content if content else "")


if __name__ == "__main__":
    # Get the directory where the script is located
    base_dir = os.path.dirname(os.path.abspath(__file__))
    create_structure(base_dir, STRUCTURE)
    print("Backend structure created successfully.")
