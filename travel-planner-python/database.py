import mysql.connector
import os


def get_connection():
    conn = mysql.connector.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("DB_PORT", "3306")),
        user=os.getenv("DB_USER", "root"),
        password=os.getenv("DB_PASSWORD", ""),
        database=os.getenv("DB_NAME", "travel_planner"),
        autocommit=False,
    )
    return conn


def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    statements = [
        """
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS trips (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            destination VARCHAR(255) NOT NULL,
            start_date VARCHAR(20) NOT NULL,
            end_date VARCHAR(20) NOT NULL,
            budget DECIMAL(10, 2),
            travelers INT DEFAULT 1,
            style VARCHAR(100),
            status VARCHAR(50) DEFAULT 'planned',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS itineraries (
            id INT AUTO_INCREMENT PRIMARY KEY,
            trip_id INT NOT NULL,
            day_number INT NOT NULL,
            activities TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS expenses (
            id INT AUTO_INCREMENT PRIMARY KEY,
            trip_id INT NOT NULL,
            category VARCHAR(100) NOT NULL,
            amount DECIMAL(10, 2) NOT NULL,
            description TEXT,
            date VARCHAR(20) NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS saved_places (
            id INT AUTO_INCREMENT PRIMARY KEY,
            trip_id INT NOT NULL,
            name VARCHAR(255) NOT NULL,
            address TEXT,
            lat DECIMAL(10, 7),
            lng DECIMAL(10, 7),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE
        )
        """,
    ]

    for stmt in statements:
        cursor.execute(stmt)

    conn.commit()
    cursor.close()
    conn.close()
