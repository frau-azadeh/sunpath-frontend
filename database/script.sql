USE [SunPathDb]
GO
/****** Object:  Table [dbo].[Drivers]    Script Date: 9/10/2026 8:57:03 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Drivers](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[FirstName] [nvarchar](100) NOT NULL,
	[LastName] [nvarchar](100) NOT NULL,
	[NationalId] [nvarchar](20) NOT NULL,
	[Phone] [nvarchar](20) NOT NULL,
	[LicenseType] [int] NOT NULL,
	[CreatedAt] [datetime] NOT NULL,
	[Username] [nvarchar](50) NULL,
	[PasswordHash] [nvarchar](255) NULL,
	[IsActive] [bit] NOT NULL,
 CONSTRAINT [PK_Drivers] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Missions]    Script Date: 9/10/2026 8:57:03 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Missions](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[VehicleId] [int] NULL,
	[Origin] [nvarchar](200) NULL,
	[Destination] [nvarchar](200) NULL,
	[Status] [int] NULL,
	[CreatedAt] [datetime] NULL,
	[DriverId] [int] NULL,
	[Title] [nvarchar](200) NULL,
	[Description] [nvarchar](1000) NULL,
	[OriginTitle] [nvarchar](300) NULL,
	[OriginLatitude] [decimal](10, 7) NULL,
	[OriginLongitude] [decimal](10, 7) NULL,
	[DestinationTitle] [nvarchar](300) NULL,
	[DestinationLatitude] [decimal](10, 7) NULL,
	[DestinationLongitude] [decimal](10, 7) NULL,
	[StartedAtUtc] [datetime2](7) NULL,
	[CompletedAtUtc] [datetime2](7) NULL,
	[CreatedAtUtc] [datetime2](7) NULL,
	[UpdatedAtUtc] [datetime2](7) NULL,
PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[MissionStatusHistory]    Script Date: 9/10/2026 8:57:03 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[MissionStatusHistory](
	[Id] [bigint] IDENTITY(1,1) NOT NULL,
	[MissionId] [int] NOT NULL,
	[FromStatus] [int] NULL,
	[ToStatus] [int] NOT NULL,
	[ChangedByUserId] [int] NULL,
	[Note] [nvarchar](500) NULL,
	[CreatedAt] [datetime2](0) NOT NULL,
 CONSTRAINT [PK_MissionStatusHistory] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[TripMetrics]    Script Date: 9/10/2026 8:57:03 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[TripMetrics](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[MissionId] [int] NOT NULL,
	[DriverId] [int] NOT NULL,
	[VehicleId] [int] NOT NULL,
	[StartLatitude] [decimal](10, 7) NOT NULL,
	[StartLongitude] [decimal](10, 7) NOT NULL,
	[EndLatitude] [decimal](10, 7) NULL,
	[EndLongitude] [decimal](10, 7) NULL,
	[TotalDistanceKm] [decimal](8, 2) NOT NULL,
	[TotalDurationMinutes] [decimal](8, 2) NOT NULL,
	[StopDurationMinutes] [decimal](8, 2) NOT NULL,
	[FuelConsumedLiters] [decimal](8, 2) NOT NULL,
	[AverageSpeedKmh] [decimal](6, 2) NOT NULL,
	[EfficiencyScore] [decimal](5, 2) NOT NULL,
	[TripStatus] [int] NOT NULL,
	[CreatedAt] [datetime2](7) NOT NULL,
	[CompletedAt] [datetime2](7) NULL,
PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[VehicleLocationHistory]    Script Date: 9/10/2026 8:57:03 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[VehicleLocationHistory](
	[Id] [bigint] IDENTITY(1,1) NOT NULL,
	[VehicleId] [int] NOT NULL,
	[DriverId] [int] NULL,
	[MissionId] [int] NULL,
	[Latitude] [decimal](9, 6) NOT NULL,
	[Longitude] [decimal](9, 6) NOT NULL,
	[Speed] [decimal](8, 2) NULL,
	[Heading] [decimal](8, 2) NULL,
	[Accuracy] [decimal](8, 2) NULL,
	[Altitude] [decimal](10, 2) NULL,
	[RecordedAt] [datetime2](0) NOT NULL,
	[ReceivedAt] [datetime2](0) NOT NULL,
 CONSTRAINT [PK_VehicleLocationHistory] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Vehicles]    Script Date: 9/10/2026 8:57:03 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Vehicles](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[PlateNumber] [nvarchar](20) NOT NULL,
	[Model] [nvarchar](50) NULL,
	[Status] [int] NULL,
	[LastLatitude] [decimal](9, 6) NULL,
	[LastLongitude] [decimal](9, 6) NULL,
	[LastUpdateAt] [datetime] NULL,
	[Speed] [float] NOT NULL,
	[Heading] [float] NOT NULL,
	[Latitude] [float] NULL,
	[Longitude] [float] NULL,
	[LastUpdate] [datetime] NULL,
	[VehicleType] [int] NOT NULL,
	[InsuranceNumber] [nvarchar](50) NULL,
	[InsuranceExpiryDate] [datetime] NULL,
	[CurrentDriverId] [int] NULL,
	[LastLocationUpdatedAtUtc] [datetime2](7) NULL,
	[FuelConsumedLiters] [float] NULL,
	[TripDistanceKm] [float] NULL,
	[TripDurationSeconds] [int] NULL,
	[StopDurationSeconds] [int] NULL,
PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
SET IDENTITY_INSERT [dbo].[Drivers] ON 

INSERT [dbo].[Drivers] ([Id], [FirstName], [LastName], [NationalId], [Phone], [LicenseType], [CreatedAt], [Username], [PasswordHash], [IsActive]) VALUES (1, N'علی', N'رضایی', N'0012345678', N'09120100001', 4, CAST(N'2026-08-12T19:53:27.890' AS DateTime), N'09120100001', N'123456', 1)
INSERT [dbo].[Drivers] ([Id], [FirstName], [LastName], [NationalId], [Phone], [LicenseType], [CreatedAt], [Username], [PasswordHash], [IsActive]) VALUES (2, N'مهدی', N'کاظمی', N'0012345679', N'09120100002', 3, CAST(N'2026-08-12T19:53:27.890' AS DateTime), N'09120100002', N'123456', 1)
INSERT [dbo].[Drivers] ([Id], [FirstName], [LastName], [NationalId], [Phone], [LicenseType], [CreatedAt], [Username], [PasswordHash], [IsActive]) VALUES (3, N'حسین', N'مرادی', N'0012345680', N'09120100003', 2, CAST(N'2026-08-12T19:53:27.890' AS DateTime), N'09120100003', N'123456', 1)
INSERT [dbo].[Drivers] ([Id], [FirstName], [LastName], [NationalId], [Phone], [LicenseType], [CreatedAt], [Username], [PasswordHash], [IsActive]) VALUES (4, N'رضا', N'احمدی', N'0012345681', N'09120100004', 4, CAST(N'2026-08-12T19:53:27.890' AS DateTime), N'09120100004', N'123456', 1)
INSERT [dbo].[Drivers] ([Id], [FirstName], [LastName], [NationalId], [Phone], [LicenseType], [CreatedAt], [Username], [PasswordHash], [IsActive]) VALUES (5, N'سعید', N'محمدی', N'0012345682', N'09120100005', 1, CAST(N'2026-08-12T19:53:27.890' AS DateTime), N'09120100005', N'123456', 1)
INSERT [dbo].[Drivers] ([Id], [FirstName], [LastName], [NationalId], [Phone], [LicenseType], [CreatedAt], [Username], [PasswordHash], [IsActive]) VALUES (6, N'امیر', N'نصیری', N'0012345683', N'09120100006', 3, CAST(N'2026-08-12T19:53:27.890' AS DateTime), N'09120100006', N'123456', 1)
INSERT [dbo].[Drivers] ([Id], [FirstName], [LastName], [NationalId], [Phone], [LicenseType], [CreatedAt], [Username], [PasswordHash], [IsActive]) VALUES (7, N'فرهاد', N'یوسفی', N'0012345684', N'09120100007', 4, CAST(N'2026-08-12T19:53:27.890' AS DateTime), N'09120100007', N'123456', 1)
INSERT [dbo].[Drivers] ([Id], [FirstName], [LastName], [NationalId], [Phone], [LicenseType], [CreatedAt], [Username], [PasswordHash], [IsActive]) VALUES (8, N'جواد', N'حیدری', N'0012345685', N'09120100008', 2, CAST(N'2026-08-12T19:53:27.890' AS DateTime), N'09120100008', N'123456', 1)
INSERT [dbo].[Drivers] ([Id], [FirstName], [LastName], [NationalId], [Phone], [LicenseType], [CreatedAt], [Username], [PasswordHash], [IsActive]) VALUES (9, N'بهرام', N'اکبری', N'0012345686', N'09120100009', 3, CAST(N'2026-08-12T19:53:27.890' AS DateTime), N'09120100009', N'123456', 1)
INSERT [dbo].[Drivers] ([Id], [FirstName], [LastName], [NationalId], [Phone], [LicenseType], [CreatedAt], [Username], [PasswordHash], [IsActive]) VALUES (10, N'پویا', N'صادقی', N'0012345687', N'09120100010', 3, CAST(N'2026-08-12T19:53:27.890' AS DateTime), N'09120100010', N'123456', 1)
INSERT [dbo].[Drivers] ([Id], [FirstName], [LastName], [NationalId], [Phone], [LicenseType], [CreatedAt], [Username], [PasswordHash], [IsActive]) VALUES (14, N'اکبر', N'مرادی', N'0065985263', N'09126598852', 1, CAST(N'2026-08-16T22:13:22.077' AS DateTime), N'09126598852', N'123456', 1)
INSERT [dbo].[Drivers] ([Id], [FirstName], [LastName], [NationalId], [Phone], [LicenseType], [CreatedAt], [Username], [PasswordHash], [IsActive]) VALUES (15, N'احمد', N'یاری', N'0023659874', N'09126598745', 1, CAST(N'2026-08-18T18:52:24.937' AS DateTime), N'09126598745', N'123456', 1)
INSERT [dbo].[Drivers] ([Id], [FirstName], [LastName], [NationalId], [Phone], [LicenseType], [CreatedAt], [Username], [PasswordHash], [IsActive]) VALUES (16, N'علی', N'مجمد', N'0067414273', N'09122769986', 1, CAST(N'2026-08-18T18:54:30.247' AS DateTime), N'09122769986', N'123456', 1)
SET IDENTITY_INSERT [dbo].[Drivers] OFF
GO
SET IDENTITY_INSERT [dbo].[Missions] ON 

INSERT [dbo].[Missions] ([Id], [VehicleId], [Origin], [Destination], [Status], [CreatedAt], [DriverId], [Title], [Description], [OriginTitle], [OriginLatitude], [OriginLongitude], [DestinationTitle], [DestinationLatitude], [DestinationLongitude], [StartedAtUtc], [CompletedAtUtc], [CreatedAtUtc], [UpdatedAtUtc]) VALUES (5, 22, NULL, NULL, 1, CAST(N'2026-08-20T22:07:27.500' AS DateTime), 6, N'بار شعبه یزد', NULL, N'مبدأ (35.670, 51.432)', CAST(35.6695096 AS Decimal(10, 7)), CAST(51.4323138 AS Decimal(10, 7)), N'مقصد (35.667, 51.400)', CAST(35.6674605 AS Decimal(10, 7)), CAST(51.3995979 AS Decimal(10, 7)), NULL, NULL, CAST(N'2026-08-20T18:37:27.4700000' AS DateTime2), NULL)
INSERT [dbo].[Missions] ([Id], [VehicleId], [Origin], [Destination], [Status], [CreatedAt], [DriverId], [Title], [Description], [OriginTitle], [OriginLatitude], [OriginLongitude], [DestinationTitle], [DestinationLatitude], [DestinationLongitude], [StartedAtUtc], [CompletedAtUtc], [CreatedAtUtc], [UpdatedAtUtc]) VALUES (6, 17, NULL, NULL, 1, CAST(N'2026-08-21T07:51:08.000' AS DateTime), 3, N'دفتر', N'رازی', N'مبدأ (35.693, 51.408)', CAST(35.6934268 AS Decimal(10, 7)), CAST(51.4082676 AS Decimal(10, 7)), N'مقصد (35.697, 51.386)', CAST(35.6967971 AS Decimal(10, 7)), CAST(51.3859965 AS Decimal(10, 7)), NULL, NULL, CAST(N'2026-08-21T04:21:07.9766667' AS DateTime2), NULL)
INSERT [dbo].[Missions] ([Id], [VehicleId], [Origin], [Destination], [Status], [CreatedAt], [DriverId], [Title], [Description], [OriginTitle], [OriginLatitude], [OriginLongitude], [DestinationTitle], [DestinationLatitude], [DestinationLongitude], [StartedAtUtc], [CompletedAtUtc], [CreatedAtUtc], [UpdatedAtUtc]) VALUES (7, 1, NULL, NULL, 1, CAST(N'2026-08-21T08:11:30.530' AS DateTime), 3, N'انبار 17', NULL, N'مبدأ (35.694, 51.479)', CAST(35.6937057 AS Decimal(10, 7)), CAST(51.4793759 AS Decimal(10, 7)), N'مقصد (35.673, 51.423)', CAST(35.6731638 AS Decimal(10, 7)), CAST(51.4226266 AS Decimal(10, 7)), NULL, NULL, CAST(N'2026-08-21T04:41:30.5300000' AS DateTime2), NULL)
INSERT [dbo].[Missions] ([Id], [VehicleId], [Origin], [Destination], [Status], [CreatedAt], [DriverId], [Title], [Description], [OriginTitle], [OriginLatitude], [OriginLongitude], [DestinationTitle], [DestinationLatitude], [DestinationLongitude], [StartedAtUtc], [CompletedAtUtc], [CreatedAtUtc], [UpdatedAtUtc]) VALUES (8, 11, NULL, NULL, 2, CAST(N'2026-08-23T12:53:06.247' AS DateTime), 7, N'مرکزی', NULL, N'فتح', CAST(35.7167789 AS Decimal(10, 7)), CAST(51.3957415 AS Decimal(10, 7)), N'شریفی', CAST(35.7099057 AS Decimal(10, 7)), CAST(51.3724690 AS Decimal(10, 7)), CAST(N'2026-09-10T17:10:15.9757000' AS DateTime2), NULL, CAST(N'2026-08-23T09:23:06.1966667' AS DateTime2), CAST(N'2026-09-10T17:10:15.9757000' AS DateTime2))
INSERT [dbo].[Missions] ([Id], [VehicleId], [Origin], [Destination], [Status], [CreatedAt], [DriverId], [Title], [Description], [OriginTitle], [OriginLatitude], [OriginLongitude], [DestinationTitle], [DestinationLatitude], [DestinationLongitude], [StartedAtUtc], [CompletedAtUtc], [CreatedAtUtc], [UpdatedAtUtc]) VALUES (9, 18, NULL, NULL, 1, CAST(N'2026-09-10T17:43:50.650' AS DateTime), 16, N'زث', N'یُژ', N'مبدأ (35.699, 51.338)', CAST(35.6987889 AS Decimal(10, 7)), CAST(51.3383783 AS Decimal(10, 7)), N'مقصد (35.709, 51.310)', CAST(35.7087795 AS Decimal(10, 7)), CAST(51.3102488 AS Decimal(10, 7)), NULL, NULL, CAST(N'2026-09-10T14:13:50.5933333' AS DateTime2), NULL)
SET IDENTITY_INSERT [dbo].[Missions] OFF
GO
SET IDENTITY_INSERT [dbo].[Vehicles] ON 

INSERT [dbo].[Vehicles] ([Id], [PlateNumber], [Model], [Status], [LastLatitude], [LastLongitude], [LastUpdateAt], [Speed], [Heading], [Latitude], [Longitude], [LastUpdate], [VehicleType], [InsuranceNumber], [InsuranceExpiryDate], [CurrentDriverId], [LastLocationUpdatedAtUtc], [FuelConsumedLiters], [TripDistanceKm], [TripDurationSeconds], [StopDurationSeconds]) VALUES (1, N'12-345-AB', N'Benz Actros', 0, CAST(35.689200 AS Decimal(9, 6)), CAST(51.389000 AS Decimal(9, 6)), CAST(N'2026-08-11T23:18:28.623' AS DateTime), 25, 223, 35.6892, 52.495400000010527, CAST(N'2026-08-12T14:11:53.283' AS DateTime), 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL)
INSERT [dbo].[Vehicles] ([Id], [PlateNumber], [Model], [Status], [LastLatitude], [LastLongitude], [LastUpdateAt], [Speed], [Heading], [Latitude], [Longitude], [LastUpdate], [VehicleType], [InsuranceNumber], [InsuranceExpiryDate], [CurrentDriverId], [LastLocationUpdatedAtUtc], [FuelConsumedLiters], [TripDistanceKm], [TripDurationSeconds], [StopDurationSeconds]) VALUES (2, N'98-765-CD', N'Isuzu NPR', 0, CAST(35.700000 AS Decimal(9, 6)), CAST(51.410000 AS Decimal(9, 6)), CAST(N'2026-08-11T23:19:06.870' AS DateTime), 25, 180, 35.7, 51.41, CAST(N'2026-08-11T23:19:06.870' AS DateTime), 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL)
INSERT [dbo].[Vehicles] ([Id], [PlateNumber], [Model], [Status], [LastLatitude], [LastLongitude], [LastUpdateAt], [Speed], [Heading], [Latitude], [Longitude], [LastUpdate], [VehicleType], [InsuranceNumber], [InsuranceExpiryDate], [CurrentDriverId], [LastLocationUpdatedAtUtc], [FuelConsumedLiters], [TripDistanceKm], [TripDurationSeconds], [StopDurationSeconds]) VALUES (3, N'11الف11111', N'پژو 405', 1, CAST(35.689200 AS Decimal(9, 6)), CAST(51.389000 AS Decimal(9, 6)), CAST(N'2026-08-12T19:53:27.900' AS DateTime), 42, 90, 35.6892, 51.389, CAST(N'2026-08-12T19:53:27.900' AS DateTime), 2, N'INS-1405-0001', CAST(N'2027-03-20T00:00:00.000' AS DateTime), 1, NULL, NULL, NULL, NULL, NULL)
INSERT [dbo].[Vehicles] ([Id], [PlateNumber], [Model], [Status], [LastLatitude], [LastLongitude], [LastUpdateAt], [Speed], [Heading], [Latitude], [Longitude], [LastUpdate], [VehicleType], [InsuranceNumber], [InsuranceExpiryDate], [CurrentDriverId], [LastLocationUpdatedAtUtc], [FuelConsumedLiters], [TripDistanceKm], [TripDurationSeconds], [StopDurationSeconds]) VALUES (4, N'22ب22222', N'پراید 131', 1, CAST(35.700100 AS Decimal(9, 6)), CAST(51.410200 AS Decimal(9, 6)), CAST(N'2026-08-12T19:53:27.900' AS DateTime), 35, 120, 35.7001, 51.4102, CAST(N'2026-08-12T19:53:27.900' AS DateTime), 2, N'INS-1405-0002', CAST(N'2027-05-14T00:00:00.000' AS DateTime), 2, NULL, NULL, NULL, NULL, NULL)
INSERT [dbo].[Vehicles] ([Id], [PlateNumber], [Model], [Status], [LastLatitude], [LastLongitude], [LastUpdateAt], [Speed], [Heading], [Latitude], [Longitude], [LastUpdate], [VehicleType], [InsuranceNumber], [InsuranceExpiryDate], [CurrentDriverId], [LastLocationUpdatedAtUtc], [FuelConsumedLiters], [TripDistanceKm], [TripDurationSeconds], [StopDurationSeconds]) VALUES (5, N'33پ33333', N'نیسان وانت', 2, CAST(35.715400 AS Decimal(9, 6)), CAST(51.432100 AS Decimal(9, 6)), CAST(N'2026-08-12T19:53:27.900' AS DateTime), 55, 180, 35.7154, 51.4321, CAST(N'2026-08-12T19:53:27.900' AS DateTime), 4, N'INS-1405-0003', CAST(N'2027-07-01T00:00:00.000' AS DateTime), 3, NULL, NULL, NULL, NULL, NULL)
INSERT [dbo].[Vehicles] ([Id], [PlateNumber], [Model], [Status], [LastLatitude], [LastLongitude], [LastUpdateAt], [Speed], [Heading], [Latitude], [Longitude], [LastUpdate], [VehicleType], [InsuranceNumber], [InsuranceExpiryDate], [CurrentDriverId], [LastLocationUpdatedAtUtc], [FuelConsumedLiters], [TripDistanceKm], [TripDurationSeconds], [StopDurationSeconds]) VALUES (6, N'44ت44444', N'کامیون ایسوزو', 1, CAST(35.680500 AS Decimal(9, 6)), CAST(51.360700 AS Decimal(9, 6)), CAST(N'2026-08-12T19:53:27.900' AS DateTime), 48, 60, 35.6805, 51.3607, CAST(N'2026-08-12T19:53:27.900' AS DateTime), 4, N'INS-1405-0004', CAST(N'2027-01-10T00:00:00.000' AS DateTime), 4, NULL, NULL, NULL, NULL, NULL)
INSERT [dbo].[Vehicles] ([Id], [PlateNumber], [Model], [Status], [LastLatitude], [LastLongitude], [LastUpdateAt], [Speed], [Heading], [Latitude], [Longitude], [LastUpdate], [VehicleType], [InsuranceNumber], [InsuranceExpiryDate], [CurrentDriverId], [LastLocationUpdatedAtUtc], [FuelConsumedLiters], [TripDistanceKm], [TripDurationSeconds], [StopDurationSeconds]) VALUES (7, N'55ث55555', N'هوندا 125', 1, CAST(35.721800 AS Decimal(9, 6)), CAST(51.398600 AS Decimal(9, 6)), CAST(N'2026-08-12T19:53:27.900' AS DateTime), 28, 45, 35.7218, 51.3986, CAST(N'2026-08-12T19:53:27.900' AS DateTime), 1, N'INS-1405-0005', CAST(N'2026-12-18T00:00:00.000' AS DateTime), 5, NULL, NULL, NULL, NULL, NULL)
INSERT [dbo].[Vehicles] ([Id], [PlateNumber], [Model], [Status], [LastLatitude], [LastLongitude], [LastUpdateAt], [Speed], [Heading], [Latitude], [Longitude], [LastUpdate], [VehicleType], [InsuranceNumber], [InsuranceExpiryDate], [CurrentDriverId], [LastLocationUpdatedAtUtc], [FuelConsumedLiters], [TripDistanceKm], [TripDurationSeconds], [StopDurationSeconds]) VALUES (8, N'66ج66666', N'باجاج 180', 0, CAST(35.734000 AS Decimal(9, 6)), CAST(51.445900 AS Decimal(9, 6)), CAST(N'2026-08-12T19:53:27.900' AS DateTime), 0, 0, 35.734, 51.4459, CAST(N'2026-08-12T19:53:27.900' AS DateTime), 1, N'INS-1405-0006', CAST(N'2027-08-22T00:00:00.000' AS DateTime), 6, NULL, NULL, NULL, NULL, NULL)
INSERT [dbo].[Vehicles] ([Id], [PlateNumber], [Model], [Status], [LastLatitude], [LastLongitude], [LastUpdateAt], [Speed], [Heading], [Latitude], [Longitude], [LastUpdate], [VehicleType], [InsuranceNumber], [InsuranceExpiryDate], [CurrentDriverId], [LastLocationUpdatedAtUtc], [FuelConsumedLiters], [TripDistanceKm], [TripDurationSeconds], [StopDurationSeconds]) VALUES (9, N'77چ77777', N'سمند LX', 1, CAST(35.662300 AS Decimal(9, 6)), CAST(51.372400 AS Decimal(9, 6)), CAST(N'2026-08-12T19:53:27.900' AS DateTime), 50, 210, 35.6623, 51.3724, CAST(N'2026-08-12T19:53:27.900' AS DateTime), 2, N'INS-1405-0007', CAST(N'2027-02-11T00:00:00.000' AS DateTime), 7, NULL, NULL, NULL, NULL, NULL)
INSERT [dbo].[Vehicles] ([Id], [PlateNumber], [Model], [Status], [LastLatitude], [LastLongitude], [LastUpdateAt], [Speed], [Heading], [Latitude], [Longitude], [LastUpdate], [VehicleType], [InsuranceNumber], [InsuranceExpiryDate], [CurrentDriverId], [LastLocationUpdatedAtUtc], [FuelConsumedLiters], [TripDistanceKm], [TripDurationSeconds], [StopDurationSeconds]) VALUES (10, N'88ح88888', N'تیبا 2', 1, CAST(35.746900 AS Decimal(9, 6)), CAST(51.401500 AS Decimal(9, 6)), CAST(N'2026-08-12T19:53:27.900' AS DateTime), 38, 135, 35.7469, 51.4015, CAST(N'2026-08-12T19:53:27.900' AS DateTime), 2, N'INS-1405-0008', CAST(N'2027-06-09T00:00:00.000' AS DateTime), 8, NULL, NULL, NULL, NULL, NULL)
INSERT [dbo].[Vehicles] ([Id], [PlateNumber], [Model], [Status], [LastLatitude], [LastLongitude], [LastUpdateAt], [Speed], [Heading], [Latitude], [Longitude], [LastUpdate], [VehicleType], [InsuranceNumber], [InsuranceExpiryDate], [CurrentDriverId], [LastLocationUpdatedAtUtc], [FuelConsumedLiters], [TripDistanceKm], [TripDurationSeconds], [StopDurationSeconds]) VALUES (11, N'99خ99999', N'کامیونت فوتون', 1, CAST(35.734201 AS Decimal(9, 6)), CAST(51.302782 AS Decimal(9, 6)), CAST(N'2026-09-10T17:19:30.513' AS DateTime), 129.32947519159379, 0, 35.734201016461043, 51.302782013866384, CAST(N'2026-09-10T20:49:30.523' AS DateTime), 4, N'INS-1405-0009', CAST(N'2026-11-30T00:00:00.000' AS DateTime), 9, NULL, 0.011038933030480067, 0.12986980035858903, 526, 0)
INSERT [dbo].[Vehicles] ([Id], [PlateNumber], [Model], [Status], [LastLatitude], [LastLongitude], [LastUpdateAt], [Speed], [Heading], [Latitude], [Longitude], [LastUpdate], [VehicleType], [InsuranceNumber], [InsuranceExpiryDate], [CurrentDriverId], [LastLocationUpdatedAtUtc], [FuelConsumedLiters], [TripDistanceKm], [TripDurationSeconds], [StopDurationSeconds]) VALUES (13, N'12 ل 88 - 50', N'هوندا', 1, NULL, NULL, CAST(N'2026-08-16T20:07:24.247' AS DateTime), 0, 0, NULL, NULL, NULL, 3, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL)
INSERT [dbo].[Vehicles] ([Id], [PlateNumber], [Model], [Status], [LastLatitude], [LastLongitude], [LastUpdateAt], [Speed], [Heading], [Latitude], [Longitude], [LastUpdate], [VehicleType], [InsuranceNumber], [InsuranceExpiryDate], [CurrentDriverId], [LastLocationUpdatedAtUtc], [FuelConsumedLiters], [TripDistanceKm], [TripDurationSeconds], [StopDurationSeconds]) VALUES (14, N'12 ل 88 -50', N'هوندا', 1, NULL, NULL, CAST(N'2026-08-16T20:08:03.617' AS DateTime), 0, 0, NULL, NULL, NULL, 3, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL)
INSERT [dbo].[Vehicles] ([Id], [PlateNumber], [Model], [Status], [LastLatitude], [LastLongitude], [LastUpdateAt], [Speed], [Heading], [Latitude], [Longitude], [LastUpdate], [VehicleType], [InsuranceNumber], [InsuranceExpiryDate], [CurrentDriverId], [LastLocationUpdatedAtUtc], [FuelConsumedLiters], [TripDistanceKm], [TripDurationSeconds], [StopDurationSeconds]) VALUES (15, N'12 ل 88 -60', N'کامیونت فوتون', 1, NULL, NULL, CAST(N'2026-08-16T21:37:05.020' AS DateTime), 0, 0, NULL, NULL, NULL, 2, NULL, CAST(N'2026-08-16T00:00:00.000' AS DateTime), NULL, NULL, NULL, NULL, NULL, NULL)
INSERT [dbo].[Vehicles] ([Id], [PlateNumber], [Model], [Status], [LastLatitude], [LastLongitude], [LastUpdateAt], [Speed], [Heading], [Latitude], [Longitude], [LastUpdate], [VehicleType], [InsuranceNumber], [InsuranceExpiryDate], [CurrentDriverId], [LastLocationUpdatedAtUtc], [FuelConsumedLiters], [TripDistanceKm], [TripDurationSeconds], [StopDurationSeconds]) VALUES (17, N'93 و 989 - 44', N'110', 1, NULL, NULL, CAST(N'2026-08-16T21:41:05.270' AS DateTime), 0, 0, NULL, NULL, NULL, 0, NULL, CAST(N'2026-11-02T00:00:00.000' AS DateTime), NULL, NULL, NULL, NULL, NULL, NULL)
INSERT [dbo].[Vehicles] ([Id], [PlateNumber], [Model], [Status], [LastLatitude], [LastLongitude], [LastUpdateAt], [Speed], [Heading], [Latitude], [Longitude], [LastUpdate], [VehicleType], [InsuranceNumber], [InsuranceExpiryDate], [CurrentDriverId], [LastLocationUpdatedAtUtc], [FuelConsumedLiters], [TripDistanceKm], [TripDurationSeconds], [StopDurationSeconds]) VALUES (18, N'12 ر 456 - 55', N'آبی', 1, NULL, NULL, CAST(N'2026-08-16T21:43:12.103' AS DateTime), 0, 0, NULL, NULL, NULL, 1, NULL, CAST(N'2026-08-22T00:00:00.000' AS DateTime), NULL, NULL, NULL, NULL, NULL, NULL)
INSERT [dbo].[Vehicles] ([Id], [PlateNumber], [Model], [Status], [LastLatitude], [LastLongitude], [LastUpdateAt], [Speed], [Heading], [Latitude], [Longitude], [LastUpdate], [VehicleType], [InsuranceNumber], [InsuranceExpiryDate], [CurrentDriverId], [LastLocationUpdatedAtUtc], [FuelConsumedLiters], [TripDistanceKm], [TripDurationSeconds], [StopDurationSeconds]) VALUES (20, N'66 - 555 ف 40', N'سمند LX', 0, NULL, NULL, CAST(N'2026-08-16T21:50:28.547' AS DateTime), 0, 0, NULL, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL)
INSERT [dbo].[Vehicles] ([Id], [PlateNumber], [Model], [Status], [LastLatitude], [LastLongitude], [LastUpdateAt], [Speed], [Heading], [Latitude], [Longitude], [LastUpdate], [VehicleType], [InsuranceNumber], [InsuranceExpiryDate], [CurrentDriverId], [LastLocationUpdatedAtUtc], [FuelConsumedLiters], [TripDistanceKm], [TripDurationSeconds], [StopDurationSeconds]) VALUES (22, N'12 ل 355 ایران 12', N'206', 1, NULL, NULL, CAST(N'2026-08-18T19:15:56.753' AS DateTime), 0, 0, NULL, NULL, NULL, 0, N'INS-1405-0009', CAST(N'2026-08-18T00:00:00.000' AS DateTime), NULL, NULL, NULL, NULL, NULL, NULL)
SET IDENTITY_INSERT [dbo].[Vehicles] OFF
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [UQ_Drivers_NationalId]    Script Date: 9/10/2026 8:57:03 PM ******/
ALTER TABLE [dbo].[Drivers] ADD  CONSTRAINT [UQ_Drivers_NationalId] UNIQUE NONCLUSTERED 
(
	[NationalId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [UQ_Vehicles_PlateNumber]    Script Date: 9/10/2026 8:57:03 PM ******/
ALTER TABLE [dbo].[Vehicles] ADD  CONSTRAINT [UQ_Vehicles_PlateNumber] UNIQUE NONCLUSTERED 
(
	[PlateNumber] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
ALTER TABLE [dbo].[Drivers] ADD  CONSTRAINT [DF_Drivers_CreatedAt]  DEFAULT (getdate()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[Drivers] ADD  DEFAULT ((1)) FOR [IsActive]
GO
ALTER TABLE [dbo].[Missions] ADD  DEFAULT ((0)) FOR [Status]
GO
ALTER TABLE [dbo].[Missions] ADD  DEFAULT (getdate()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[MissionStatusHistory] ADD  CONSTRAINT [DF_MissionStatusHistory_CreatedAt]  DEFAULT (sysutcdatetime()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[TripMetrics] ADD  DEFAULT ((0.0)) FOR [TotalDistanceKm]
GO
ALTER TABLE [dbo].[TripMetrics] ADD  DEFAULT ((0.0)) FOR [TotalDurationMinutes]
GO
ALTER TABLE [dbo].[TripMetrics] ADD  DEFAULT ((0.0)) FOR [StopDurationMinutes]
GO
ALTER TABLE [dbo].[TripMetrics] ADD  DEFAULT ((0.0)) FOR [FuelConsumedLiters]
GO
ALTER TABLE [dbo].[TripMetrics] ADD  DEFAULT ((0.0)) FOR [AverageSpeedKmh]
GO
ALTER TABLE [dbo].[TripMetrics] ADD  DEFAULT ((100.0)) FOR [EfficiencyScore]
GO
ALTER TABLE [dbo].[TripMetrics] ADD  DEFAULT ((0)) FOR [TripStatus]
GO
ALTER TABLE [dbo].[TripMetrics] ADD  DEFAULT (sysutcdatetime()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[VehicleLocationHistory] ADD  CONSTRAINT [DF_VehicleLocationHistory_ReceivedAt]  DEFAULT (sysutcdatetime()) FOR [ReceivedAt]
GO
ALTER TABLE [dbo].[Vehicles] ADD  DEFAULT ((0)) FOR [Status]
GO
ALTER TABLE [dbo].[Vehicles] ADD  DEFAULT (getdate()) FOR [LastUpdateAt]
GO
ALTER TABLE [dbo].[Vehicles] ADD  DEFAULT ((0)) FOR [Speed]
GO
ALTER TABLE [dbo].[Vehicles] ADD  DEFAULT ((0)) FOR [Heading]
GO
ALTER TABLE [dbo].[Vehicles] ADD  CONSTRAINT [DF_Vehicles_VehicleType]  DEFAULT ((0)) FOR [VehicleType]
GO
ALTER TABLE [dbo].[Missions]  WITH CHECK ADD FOREIGN KEY([VehicleId])
REFERENCES [dbo].[Vehicles] ([Id])
GO
ALTER TABLE [dbo].[Missions]  WITH CHECK ADD  CONSTRAINT [FK_Missions_Drivers_DriverId] FOREIGN KEY([DriverId])
REFERENCES [dbo].[Drivers] ([Id])
GO
ALTER TABLE [dbo].[Missions] CHECK CONSTRAINT [FK_Missions_Drivers_DriverId]
GO
ALTER TABLE [dbo].[MissionStatusHistory]  WITH CHECK ADD  CONSTRAINT [FK_MissionStatusHistory_Missions] FOREIGN KEY([MissionId])
REFERENCES [dbo].[Missions] ([Id])
GO
ALTER TABLE [dbo].[MissionStatusHistory] CHECK CONSTRAINT [FK_MissionStatusHistory_Missions]
GO
ALTER TABLE [dbo].[TripMetrics]  WITH CHECK ADD  CONSTRAINT [FK_TripMetrics_Drivers] FOREIGN KEY([DriverId])
REFERENCES [dbo].[Drivers] ([Id])
GO
ALTER TABLE [dbo].[TripMetrics] CHECK CONSTRAINT [FK_TripMetrics_Drivers]
GO
ALTER TABLE [dbo].[TripMetrics]  WITH CHECK ADD  CONSTRAINT [FK_TripMetrics_Missions] FOREIGN KEY([MissionId])
REFERENCES [dbo].[Missions] ([Id])
GO
ALTER TABLE [dbo].[TripMetrics] CHECK CONSTRAINT [FK_TripMetrics_Missions]
GO
ALTER TABLE [dbo].[TripMetrics]  WITH CHECK ADD  CONSTRAINT [FK_TripMetrics_Vehicles] FOREIGN KEY([VehicleId])
REFERENCES [dbo].[Vehicles] ([Id])
GO
ALTER TABLE [dbo].[TripMetrics] CHECK CONSTRAINT [FK_TripMetrics_Vehicles]
GO
ALTER TABLE [dbo].[VehicleLocationHistory]  WITH CHECK ADD  CONSTRAINT [FK_VehicleLocationHistory_Drivers] FOREIGN KEY([DriverId])
REFERENCES [dbo].[Drivers] ([Id])
GO
ALTER TABLE [dbo].[VehicleLocationHistory] CHECK CONSTRAINT [FK_VehicleLocationHistory_Drivers]
GO
ALTER TABLE [dbo].[VehicleLocationHistory]  WITH CHECK ADD  CONSTRAINT [FK_VehicleLocationHistory_Missions] FOREIGN KEY([MissionId])
REFERENCES [dbo].[Missions] ([Id])
GO
ALTER TABLE [dbo].[VehicleLocationHistory] CHECK CONSTRAINT [FK_VehicleLocationHistory_Missions]
GO
ALTER TABLE [dbo].[VehicleLocationHistory]  WITH CHECK ADD  CONSTRAINT [FK_VehicleLocationHistory_Vehicles] FOREIGN KEY([VehicleId])
REFERENCES [dbo].[Vehicles] ([Id])
GO
ALTER TABLE [dbo].[VehicleLocationHistory] CHECK CONSTRAINT [FK_VehicleLocationHistory_Vehicles]
GO
ALTER TABLE [dbo].[Vehicles]  WITH CHECK ADD  CONSTRAINT [FK_Vehicles_Drivers_CurrentDriverId] FOREIGN KEY([CurrentDriverId])
REFERENCES [dbo].[Drivers] ([Id])
GO
ALTER TABLE [dbo].[Vehicles] CHECK CONSTRAINT [FK_Vehicles_Drivers_CurrentDriverId]
GO
