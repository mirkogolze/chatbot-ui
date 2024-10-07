
ALTER TABLE file_items
ADD message_id uuid;

ALTER TABLE file_items
ADD source TEXT;


ALTER table file_items
ADD constraint file_items_message_id_fkey
foreign key (message_id)
references messages (id)

