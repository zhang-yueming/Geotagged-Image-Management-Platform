CREATE TABLE image_label (
    image_id INT NOT NULL,
    label VARCHAR(300),
    score FLOAT,  -- 新增score字段
    PRIMARY KEY (image_id,label),
    FOREIGN KEY (image_id) REFERENCES image(image_id)
);