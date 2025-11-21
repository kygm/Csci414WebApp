UPDATE Books
SET image_url = CASE (ABS(RANDOM()) % 4)
    WHEN 0 THEN 'https://fastly.picsum.photos/id/322/200/300.jpg?hmac=q6h4jr1n6SrXrRCeqCblcexGQCfYmSXhr8Oo5EGoHIU'
    WHEN 1 THEN 'https://images.unsplash.com/photo-1506744038136-46273834b3fb'
    WHEN 2 THEN 'https://images.unsplash.com/photo-1501785888041-af3ef285b470'
    ELSE      'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa'
END;
