DROP TABLE IF EXISTS _dir_filter;
DROP TABLE IF EXISTS directory;
CREATE TEMP TABLE _dir_filter AS
	SELECT type, directory, name as title,
	    ifnull(nullif(directory || '/', '/'), '') || name as name, URI
	    FROM tag_cache
	    WHERE type='directory'
	    ORDER BY directory, title;
CREATE TABLE directory AS
    SELECT p.URI AS URI, count(p.URI <> c.URI) as children,
        p.title AS title, p.type AS type,
        p.directory AS directory, p.name AS name
    FROM _dir_filter as p
    LEFT OUTER JOIN _dir_filter as c
    ON c.directory=p.title
    GROUP BY p.name
    ORDER BY p.URI;
DROP TABLE IF EXISTS _dir_filter;

DROP TABLE IF EXISTS genre;
CREATE TABLE genre AS
    SELECT rowid AS rank, * FROM (
	        SELECT 'genre' AS type, 'genre://' || genre AS URI,
	            genre as title, count(*) as track,
	            count(DISTINCT album) as children
            FROM file
            WHERE genre NOTNULL
            GROUP BY genre
            ORDER BY count(*) DESC
        )
        ORDER BY title;
CREATE VIEW IF NOT EXISTS topgenre AS
    SELECT * FROM genre WHERE rank < ((SELECT count(*) FROM genre)/10)+1;

DROP TABLE IF EXISTS artist;
CREATE TABLE artist AS
    SELECT rowid AS rank, * FROM (
	        SELECT 'artist' AS type, 'artist://' || artist AS URI,
	            artist as title, count(*) as track,
	            count(DISTINCT album) as children
            FROM file
            WHERE artist NOTNULL
            GROUP BY artist
            ORDER BY count(*) DESC
        )
        ORDER BY title;

CREATE VIEW IF NOT EXISTS topartist AS
    SELECT * FROM artist WHERE rank < ((SELECT count(*) FROM artist)/10)+1;

DROP TABLE IF EXISTS performer;
CREATE TABLE performer AS
    SELECT rowid AS rank, * FROM (
	        SELECT 'performer' AS type, 'performer://' || performer AS URI,
	            performer as title, count(*) as track,
	            count(DISTINCT album) as children
            FROM file
            WHERE performer NOTNULL
            GROUP BY performer
            ORDER BY count(*) DESC
        )
        ORDER BY title;

DROP TABLE IF EXISTS composer;
CREATE TABLE composer AS
    SELECT rowid AS rank, * FROM (
	        SELECT 'composer' AS type, 'composer://' || composer AS URI,
	            composer as title, count(*) as track,
	            count(DISTINCT album) as children
            FROM file
            WHERE composer NOTNULL
            GROUP BY composer
            ORDER BY count(*) DESC
        )
        ORDER BY title;

DROP TABLE IF EXISTS date;
CREATE TABLE date AS
    SELECT rowid AS rank, * FROM (
	        SELECT 'date' AS type, 'date://' || date AS URI, date as title,
	            count(*) as track, count(DISTINCT album) as children
            FROM file
            WHERE date > 1900 AND date < cast( strftime('%Y',date('now')) as INTEGER)+1
            GROUP BY date
            ORDER BY count(*) DESC
        )
        ORDER BY title;

DROP TABLE IF EXISTS album;
CREATE TABLE album AS
    SELECT rowid AS rank, * FROM (
            SELECT 'album' AS type, 'album://' || album AS URI, album as title,
	            count(*) as track, 0 as children,
                CASE count(DISTINCT artist)
                WHEN 1 THEN artist
                ELSE 'Various Artists'
                END artist
            FROM file
            WHERE album NOTNULL
            GROUP BY album
            ORDER BY count(*) DESC
        )
        ORDER BY title;

ANALYZE;
