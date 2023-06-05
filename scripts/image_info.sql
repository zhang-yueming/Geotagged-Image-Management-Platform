CREATE TABLE image_metadata (
    image_id INT NOT NULL,
    timestamp DATETIME,
    latitude DOUBLE,
    longitude DOUBLE,
    country VARCHAR(100),
    administrative_area_level_1 VARCHAR(100),
    administrative_area_level_2 VARCHAR(100),
    city VARCHAR(100),
    street VARCHAR(100),
    postal_code VARCHAR(20),
    PRIMARY KEY (image_id),
    FOREIGN KEY (image_id) REFERENCES image(image_id)  --
);