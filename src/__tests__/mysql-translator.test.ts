import { describe, it, expect } from 'vitest';
import { translateMysqlToSqlite } from '@/engines/mysql-translator';

describe('MySQL to SQLite Dialect Normalizer', () => {
  it('strips CREATE DATABASE and USE statements', () => {
    const mysql = 'CREATE DATABASE test_db; USE test_db; SELECT 1;';
    const translated = translateMysqlToSqlite(mysql);
    expect(translated).not.toContain('CREATE DATABASE');
    expect(translated).not.toContain('USE test_db');
    expect(translated).toContain('SELECT 1;');
  });

  it('translates AUTO_INCREMENT to INTEGER PRIMARY KEY AUTOINCREMENT', () => {
    const mysql = 'CREATE TABLE items (id INT PRIMARY KEY AUTO_INCREMENT, name VARCHAR(50));';
    const translated = translateMysqlToSqlite(mysql);
    expect(translated).toContain('INTEGER PRIMARY KEY AUTOINCREMENT');
  });

  it('translates ENUM types to TEXT', () => {
    const mysql = "CREATE TABLE users (status ENUM('active', 'inactive'));";
    const translated = translateMysqlToSqlite(mysql);
    expect(translated).toContain('status TEXT');
    expect(translated).not.toContain('ENUM');
  });

  it('translates DATE_FORMAT to strftime', () => {
    const mysql = "SELECT DATE_FORMAT(order_date, '%Y-%m') AS month FROM orders;";
    const translated = translateMysqlToSqlite(mysql);
    expect(translated).toContain("strftime('%Y-%m', order_date)");
  });

  it('translates NOW() to CURRENT_TIMESTAMP datetime', () => {
    const mysql = 'SELECT * FROM logs WHERE created_at < NOW();';
    const translated = translateMysqlToSqlite(mysql);
    expect(translated).toContain("datetime('now')");
  });

  it('strips MySQL engine and charset clauses', () => {
    const mysql = 'CREATE TABLE t (id INT) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;';
    const translated = translateMysqlToSqlite(mysql);
    expect(translated).not.toContain('ENGINE=InnoDB');
    expect(translated).not.toContain('DEFAULT CHARSET');
    expect(translated).not.toContain('COLLATE');
  });
});

