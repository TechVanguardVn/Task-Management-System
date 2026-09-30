-- MySQL dump 10.13  Distrib 8.0.42, for macos15 (arm64)
--
-- Host: 127.0.0.1    Database: tm_system
-- ------------------------------------------------------
-- Server version	8.4.11

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `migrations`
--

DROP TABLE IF EXISTS `migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `migrations` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `migration` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `batch` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `migrations`
--

LOCK TABLES `migrations` WRITE;
/*!40000 ALTER TABLE `migrations` DISABLE KEYS */;
INSERT INTO `migrations` VALUES (1,'0001_01_01_000000_create_users_table',1),(2,'2026_09_29_052300_create_tasks_table',1);
/*!40000 ALTER TABLE `migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tasks`
--

DROP TABLE IF EXISTS `tasks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tasks` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `status` enum('TODO','IN_PROGRESS','DONE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'TODO',
  `priority` enum('LOW','MEDIUM','HIGH') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'MEDIUM',
  `due_date` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `tasks_user_id_foreign` (`user_id`),
  CONSTRAINT `tasks_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=51 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tasks`
--

LOCK TABLES `tasks` WRITE;
/*!40000 ALTER TABLE `tasks` DISABLE KEYS */;
INSERT INTO `tasks` VALUES (1,2,'Thiết kế giao diện đăng nhập','Thiết kế layout và xác nhận trải nghiệm người dùng trên màn hình đăng nhập.','TODO','HIGH','2026-10-01','2026-09-30 11:56:22','2026-09-30 11:56:22'),(2,2,'Fix lỗi API danh sách task','Xử lý lỗi pagination và lọc dữ liệu khi API trả về nhiều bản ghi.','IN_PROGRESS','HIGH','2026-10-02','2026-09-30 11:56:22','2026-09-30 11:56:22'),(3,2,'Cập nhật giao diện dashboard','Tối ưu widget thống kê, thẻ task và trạng thái công việc.','DONE','MEDIUM','2026-09-29','2026-09-30 11:56:22','2026-09-30 11:56:22'),(4,2,'Viết unit test cho auth','Bổ sung test cho đăng ký, đăng nhập và xác thực token.','TODO','MEDIUM','2026-10-04','2026-09-30 11:56:22','2026-09-30 11:56:22'),(5,2,'Review code chức năng upload file','Kiểm tra lại xử lý file lớn và cảnh báo khi upload thất bại.','DONE','HIGH','2026-10-03','2026-09-30 11:56:22','2026-09-30 12:05:34'),(6,2,'Chuẩn bị tài liệu hướng dẫn','Soạn nội dung hướng dẫn sử dụng hệ thống cho người dùng mới.','DONE','LOW','2026-09-28','2026-09-30 11:56:22','2026-09-30 12:09:03'),(7,2,'Nâng cấp chức năng lọc task','Thêm bộ lọc theo trạng thái, mức ưu tiên và người phụ trách.','TODO','MEDIUM','2026-10-05','2026-09-30 11:56:22','2026-09-30 11:56:22'),(8,2,'Tạo báo cáo tiến độ sprint','Tổng hợp tiến độ hoàn thành công việc và rủi ro của đội.','IN_PROGRESS','MEDIUM','2026-10-06','2026-09-30 11:56:22','2026-09-30 11:56:22'),(9,2,'Tối ưu hiệu suất query','Cải thiện thời gian trả về dữ liệu của các API danh sách lớn.','IN_PROGRESS','HIGH','2026-09-27','2026-09-30 11:56:22','2026-09-30 12:05:23'),(10,2,'Dọn dẹp code và refactor','Loại bỏ đoạn code trùng lặp và cập nhật naming convention.','TODO','LOW','2026-10-07','2026-09-30 11:56:22','2026-09-30 11:56:22'),(11,3,'Thiết kế giao diện đăng nhập','Thiết kế layout và xác nhận trải nghiệm người dùng trên màn hình đăng nhập.','TODO','HIGH','2026-10-01','2026-09-30 11:56:22','2026-09-30 11:56:22'),(12,3,'Fix lỗi API danh sách task','Xử lý lỗi pagination và lọc dữ liệu khi API trả về nhiều bản ghi.','IN_PROGRESS','HIGH','2026-10-02','2026-09-30 11:56:22','2026-09-30 11:56:22'),(13,3,'Cập nhật giao diện dashboard','Tối ưu widget thống kê, thẻ task và trạng thái công việc.','DONE','MEDIUM','2026-09-29','2026-09-30 11:56:22','2026-09-30 11:56:22'),(14,3,'Viết unit test cho auth','Bổ sung test cho đăng ký, đăng nhập và xác thực token.','TODO','MEDIUM','2026-10-04','2026-09-30 11:56:22','2026-09-30 11:56:22'),(15,3,'Review code chức năng upload file','Kiểm tra lại xử lý file lớn và cảnh báo khi upload thất bại.','IN_PROGRESS','HIGH','2026-10-03','2026-09-30 11:56:22','2026-09-30 11:56:22'),(16,3,'Chuẩn bị tài liệu hướng dẫn','Soạn nội dung hướng dẫn sử dụng hệ thống cho người dùng mới.','DONE','LOW','2026-09-28','2026-09-30 11:56:22','2026-09-30 11:56:22'),(17,3,'Nâng cấp chức năng lọc task','Thêm bộ lọc theo trạng thái, mức ưu tiên và người phụ trách.','TODO','MEDIUM','2026-10-05','2026-09-30 11:56:22','2026-09-30 11:56:22'),(18,3,'Tạo báo cáo tiến độ sprint','Tổng hợp tiến độ hoàn thành công việc và rủi ro của đội.','IN_PROGRESS','MEDIUM','2026-10-06','2026-09-30 11:56:22','2026-09-30 11:56:22'),(19,3,'Tối ưu hiệu suất query','Cải thiện thời gian trả về dữ liệu của các API danh sách lớn.','DONE','HIGH','2026-09-27','2026-09-30 11:56:22','2026-09-30 11:56:22'),(20,3,'Dọn dẹp code và refactor','Loại bỏ đoạn code trùng lặp và cập nhật naming convention.','TODO','LOW','2026-10-07','2026-09-30 11:56:23','2026-09-30 11:56:23'),(21,4,'Thiết kế giao diện đăng nhập','Thiết kế layout và xác nhận trải nghiệm người dùng trên màn hình đăng nhập.','TODO','HIGH','2026-10-01','2026-09-30 11:56:23','2026-09-30 11:56:23'),(22,4,'Fix lỗi API danh sách task','Xử lý lỗi pagination và lọc dữ liệu khi API trả về nhiều bản ghi.','IN_PROGRESS','HIGH','2026-10-02','2026-09-30 11:56:23','2026-09-30 11:56:23'),(23,4,'Cập nhật giao diện dashboard','Tối ưu widget thống kê, thẻ task và trạng thái công việc.','DONE','MEDIUM','2026-09-29','2026-09-30 11:56:23','2026-09-30 11:56:23'),(24,4,'Viết unit test cho auth','Bổ sung test cho đăng ký, đăng nhập và xác thực token.','TODO','MEDIUM','2026-10-04','2026-09-30 11:56:23','2026-09-30 11:56:23'),(25,4,'Review code chức năng upload file','Kiểm tra lại xử lý file lớn và cảnh báo khi upload thất bại.','IN_PROGRESS','HIGH','2026-10-03','2026-09-30 11:56:23','2026-09-30 11:56:23'),(26,4,'Chuẩn bị tài liệu hướng dẫn','Soạn nội dung hướng dẫn sử dụng hệ thống cho người dùng mới.','DONE','LOW','2026-09-28','2026-09-30 11:56:23','2026-09-30 11:56:23'),(27,4,'Nâng cấp chức năng lọc task','Thêm bộ lọc theo trạng thái, mức ưu tiên và người phụ trách.','TODO','MEDIUM','2026-10-05','2026-09-30 11:56:23','2026-09-30 11:56:23'),(28,4,'Tạo báo cáo tiến độ sprint','Tổng hợp tiến độ hoàn thành công việc và rủi ro của đội.','IN_PROGRESS','MEDIUM','2026-10-06','2026-09-30 11:56:23','2026-09-30 11:56:23'),(29,4,'Tối ưu hiệu suất query','Cải thiện thời gian trả về dữ liệu của các API danh sách lớn.','DONE','HIGH','2026-09-27','2026-09-30 11:56:23','2026-09-30 11:56:23'),(30,4,'Dọn dẹp code và refactor','Loại bỏ đoạn code trùng lặp và cập nhật naming convention.','TODO','LOW','2026-10-07','2026-09-30 11:56:23','2026-09-30 11:56:23'),(31,5,'Thiết kế giao diện đăng nhập','Thiết kế layout và xác nhận trải nghiệm người dùng trên màn hình đăng nhập.','TODO','HIGH','2026-10-01','2026-09-30 11:56:23','2026-09-30 11:56:23'),(32,5,'Fix lỗi API danh sách task','Xử lý lỗi pagination và lọc dữ liệu khi API trả về nhiều bản ghi.','IN_PROGRESS','HIGH','2026-10-02','2026-09-30 11:56:23','2026-09-30 11:56:23'),(33,5,'Cập nhật giao diện dashboard','Tối ưu widget thống kê, thẻ task và trạng thái công việc.','DONE','MEDIUM','2026-09-29','2026-09-30 11:56:23','2026-09-30 11:56:23'),(34,5,'Viết unit test cho auth','Bổ sung test cho đăng ký, đăng nhập và xác thực token.','TODO','MEDIUM','2026-10-04','2026-09-30 11:56:23','2026-09-30 11:56:23'),(35,5,'Review code chức năng upload file','Kiểm tra lại xử lý file lớn và cảnh báo khi upload thất bại.','IN_PROGRESS','HIGH','2026-10-03','2026-09-30 11:56:23','2026-09-30 11:56:23'),(36,5,'Chuẩn bị tài liệu hướng dẫn','Soạn nội dung hướng dẫn sử dụng hệ thống cho người dùng mới.','DONE','LOW','2026-09-28','2026-09-30 11:56:23','2026-09-30 11:56:23'),(37,5,'Nâng cấp chức năng lọc task','Thêm bộ lọc theo trạng thái, mức ưu tiên và người phụ trách.','TODO','MEDIUM','2026-10-05','2026-09-30 11:56:23','2026-09-30 11:56:23'),(38,5,'Tạo báo cáo tiến độ sprint','Tổng hợp tiến độ hoàn thành công việc và rủi ro của đội.','IN_PROGRESS','MEDIUM','2026-10-06','2026-09-30 11:56:23','2026-09-30 11:56:23'),(39,5,'Tối ưu hiệu suất query','Cải thiện thời gian trả về dữ liệu của các API danh sách lớn.','DONE','HIGH','2026-09-27','2026-09-30 11:56:23','2026-09-30 11:56:23'),(40,5,'Dọn dẹp code và refactor','Loại bỏ đoạn code trùng lặp và cập nhật naming convention.','TODO','LOW','2026-10-07','2026-09-30 11:56:23','2026-09-30 11:56:23'),(41,6,'Thiết kế giao diện đăng nhập','Thiết kế layout và xác nhận trải nghiệm người dùng trên màn hình đăng nhập.','TODO','HIGH','2026-10-01','2026-09-30 11:56:23','2026-09-30 11:56:23'),(42,6,'Fix lỗi API danh sách task','Xử lý lỗi pagination và lọc dữ liệu khi API trả về nhiều bản ghi.','IN_PROGRESS','HIGH','2026-10-02','2026-09-30 11:56:23','2026-09-30 11:56:23'),(43,6,'Cập nhật giao diện dashboard','Tối ưu widget thống kê, thẻ task và trạng thái công việc.','DONE','MEDIUM','2026-09-29','2026-09-30 11:56:23','2026-09-30 11:56:23'),(44,6,'Viết unit test cho auth','Bổ sung test cho đăng ký, đăng nhập và xác thực token.','TODO','MEDIUM','2026-10-04','2026-09-30 11:56:23','2026-09-30 11:56:23'),(45,6,'Review code chức năng upload file','Kiểm tra lại xử lý file lớn và cảnh báo khi upload thất bại.','IN_PROGRESS','HIGH','2026-10-03','2026-09-30 11:56:23','2026-09-30 11:56:23'),(46,6,'Chuẩn bị tài liệu hướng dẫn','Soạn nội dung hướng dẫn sử dụng hệ thống cho người dùng mới.','DONE','LOW','2026-09-28','2026-09-30 11:56:23','2026-09-30 11:56:23'),(47,6,'Nâng cấp chức năng lọc task','Thêm bộ lọc theo trạng thái, mức ưu tiên và người phụ trách.','TODO','MEDIUM','2026-10-05','2026-09-30 11:56:23','2026-09-30 11:56:23'),(48,6,'Tạo báo cáo tiến độ sprint','Tổng hợp tiến độ hoàn thành công việc và rủi ro của đội.','IN_PROGRESS','MEDIUM','2026-10-06','2026-09-30 11:56:23','2026-09-30 11:56:23'),(49,6,'Tối ưu hiệu suất query','Cải thiện thời gian trả về dữ liệu của các API danh sách lớn.','DONE','HIGH','2026-09-27','2026-09-30 11:56:23','2026-09-30 11:56:23'),(50,6,'Dọn dẹp code và refactor','Loại bỏ đoạn code trùng lặp và cập nhật naming convention.','TODO','LOW','2026-10-07','2026-09-30 11:56:23','2026-09-30 11:56:23');
/*!40000 ALTER TABLE `tasks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `remember_token` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Cường Đặng','cuongdang.270920@gmail.com',NULL,'$2y$12$dH6jsgFSJJoGQJ/IRTtyTO.ZJl58MR4QF9J/rILs2.xsAE53FXaE.',NULL,'2026-09-30 10:56:18','2026-09-30 10:56:18'),(2,'Nguyễn Văn An','test@example.com','2026-09-30 11:56:22','$2y$12$fgCMzAV8Fr/zGuh6GQmV9.EmNwG7Jl7f8bkg1Fo9JC2UNj/XWqPW6','bAlTJ760ce','2026-09-30 11:56:22','2026-09-30 11:56:22'),(3,'Trần Thị Lan','lan.tran@example.com','2026-09-30 11:56:22','$2y$12$7AGaC2.QW/YZ2cMD/kyzbepLZA0rskM3y9yTJncE9Ptf.CoVq/njK','OPDLaGCo9x','2026-09-30 11:56:22','2026-09-30 11:56:22'),(4,'Lê Hoàng Nam','nam.le@example.com','2026-09-30 11:56:23','$2y$12$6c0SdX3Me2Kkq9k30U78ZutteOS2RRp084edbT9BI.4fczmWWNIX2','ISa2DPDUkh','2026-09-30 11:56:23','2026-09-30 11:56:23'),(5,'Phạm Thị Hương','huong.pham@example.com','2026-09-30 11:56:23','$2y$12$VTMUo01DxcoVaqk58lWzUeFtsHfDBOItYynHAmCv4WCKB4.JyCFZq','IX2RWf2DJq','2026-09-30 11:56:23','2026-09-30 11:56:23'),(6,'Võ Minh Khôi','khoi.vo@example.com','2026-09-30 11:56:23','$2y$12$QC5P9Ua7b.OhOgq9t/xQgu1Ubf2tjf7JlTYZy6RGNwmdtCdVX94gW','eMqKw76xX6','2026-09-30 11:56:23','2026-09-30 11:56:23');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-09-30 19:24:46
