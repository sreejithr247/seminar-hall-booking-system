-- =============================================
-- TEST DATA: Seminar Halls for IGNOU BCSP-064
-- =============================================

-- Clear existing halls (Optional: uncomment if you want a clean start)
-- TRUNCATE TABLE halls CASCADE;

INSERT INTO halls (hall_name, capacity, location, facilities) VALUES
-- Main Auditoriums
('Main University Auditorium', 1000, 'Main Block, Ground Floor', '{"ac": true, "projector": true, "audio_system": true, "wifi": true}'),
('Convocation Hall', 800, 'Administration Block', '{"ac": true, "audio_system": true, "wifi": false}'),
('Silver Jubilee Memorial Hall', 500, 'Academic Square', '{"ac": true, "projector": true, "audio_system": true}'),

-- Departmental Seminar Halls
('Computer Science Seminar Hall', 150, 'CS Block, 2nd Floor', '{"ac": true, "projector": true, "smart_board": true, "wifi": true}'),
('Mechanical Engineering Hall', 120, 'Workshop Block', '{"ac": false, "projector": true, "audio_system": false}'),
('Bio-Tech Research Center Hall', 100, 'Life Sciences Block', '{"ac": true, "lab_equipment": true}'),
('DMS Seminar Hall', 150, 'Management Studies Block', '{"ac": true, "projector": true}'),
('IGNOU RC Seminar Hall', 200, 'Regional Center Building', '{"ac": true, "audio_system": true}'),

-- Smart Rooms & Small Halls
('Digital Media Smart Room', 40, 'New Library Wing', '{"ac": true, "smart_tv": true, "wifi": true}'),
('IoT Virtual Lab', 50, 'CS Block, 3rd Floor', '{"ac": true, "high_speed_internet": true}'),
('Language Lab Discussion Room', 30, 'Arts & Humanities', '{"ac": false, "audio_system": true}'),
('Executive Board Room', 25, 'Admin Block, 1st Floor', '{"ac": true, "video_conferencing": true}'),

-- Activity Centers
('Student Activity Center (SAC) Hall', 150, 'Student Hub', '{"ac": false, "stage": true, "audio_system": true}'),
('Innovation & Incubation Hub', 80, 'Research Park', '{"ac": true, "wifi": true, "flexible_seating": true}'),
('Cultural Center Mini-Hall', 100, 'Near Open Air Theater', '{"ac": false, "green_room": true}');

\echo '------------------------------------------------'
\echo 'Test Hall Data Inserted Successfully!'
\echo 'Total Halls Added: 15'
\echo '------------------------------------------------'
