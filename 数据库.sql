create table address
(
    id             bigint auto_increment comment '地址ID（主键）'
        primary key,
    user_id        bigint                               not null comment '关联用户ID（外键）',
    receiver       varchar(50)                          not null comment '收件人姓名',
    phone          varchar(11)                          not null comment '收件人手机号',
    province       varchar(20)                          not null comment '省份',
    city           varchar(20)                          not null comment '城市',
    district       varchar(20)                          not null comment '区县',
    detail_address varchar(255)                         not null comment '详细地址（街道/门牌号）',
    is_default     tinyint(1) default 0                 not null comment '是否默认地址（0-否，1-是）',
    create_time    datetime   default CURRENT_TIMESTAMP not null comment '创建时间',
    update_time    datetime   default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP comment '更新时间'
)
    comment '收货地址表' collate = utf8mb4_unicode_ci;

create index idx_is_default
    on address (is_default);

create index idx_user_id
    on address (user_id);

create table admin
(
    id              bigint auto_increment comment '管理员ID（主键）'
        primary key,
    username        varchar(50)                           not null comment '管理员账号',
    password        varchar(100)                          not null comment '加密密码（BCrypt）',
    nickname        varchar(50) default ''                null comment '管理员姓名',
    role            tinyint     default 1                 not null comment '角色（1-超级管理员/2-平台运营）',
    last_login_time datetime                              null comment '最近登录时间',
    last_login_ip   varchar(50)                           null comment '最近登录IP',
    status          tinyint(1)  default 1                 not null comment '状态（0-禁用，1-启用）',
    create_time     datetime    default CURRENT_TIMESTAMP not null comment '创建时间',
    update_time     datetime    default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP comment '更新时间',
    constraint uk_username
        unique (username)
)
    comment '管理员/客服表' collate = utf8mb4_unicode_ci;

create index idx_role
    on admin (role);

create index idx_status
    on admin (status);

create table banner
(
    id          bigint auto_increment comment '轮播图ID（主键）'
        primary key,
    title       varchar(100)                         null comment '轮播图标题',
    image_url   varchar(255)                         not null comment '图片URL',
    link_url    varchar(255)                         null comment '跳转链接（如：/product/detail?productId=123）',
    link_type   varchar(20)                          null comment '链接类型（product、category、url等）',
    sort        int        default 0                 not null comment '排序（数字越小越靠前）',
    status      tinyint(1) default 1                 not null comment '状态（0-禁用，1-启用）',
    create_time datetime   default CURRENT_TIMESTAMP not null comment '创建时间',
    update_time datetime   default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP comment '更新时间'
)
    comment '首页轮播图表' collate = utf8mb4_unicode_ci;

create index idx_sort
    on banner (sort);

create index idx_status
    on banner (status);

create table cart
(
    id          bigint auto_increment comment '购物车ID（主键）'
        primary key,
    user_id     bigint                               not null comment '关联用户ID（外键）',
    product_id  bigint                               not null comment '关联商品ID（外键）',
    spec_id     bigint                               null comment '关联规格ID（外键，可空）',
    quantity    int        default 1                 not null comment '购买数量',
    checked     tinyint(1) default 0                 not null comment '是否选中（0-否，1-是）',
    create_time datetime   default CURRENT_TIMESTAMP not null comment '创建时间',
    update_time datetime   default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP comment '更新时间',
    constraint uk_user_product_spec
        unique (user_id, product_id, spec_id)
)
    comment '购物车表' collate = utf8mb4_unicode_ci;

create index fk_cart_product
    on cart (product_id);

create index fk_cart_spec
    on cart (spec_id);

create index idx_user_id
    on cart (user_id);

create table category
(
    id          bigint auto_increment comment '分类ID（主键）'
        primary key,
    name        varchar(50)                                                not null comment '分类名称',
    parent_id   bigint       default 0                                     not null comment '父分类ID（0-一级分类）',
    icon_url    varchar(648) default '/static/images/default-category.png' null comment '分类图标URL（仅一级分类）',
    sort        int          default 0                                     not null comment '排序（数字越小越靠前）',
    status      tinyint(1)   default 1                                     not null comment '状态（0-禁用，1-启用）',
    create_time datetime     default CURRENT_TIMESTAMP                     not null comment '创建时间',
    update_time datetime     default CURRENT_TIMESTAMP                     not null on update CURRENT_TIMESTAMP comment '更新时间'
)
    comment '商品分类表（支持一级/二级分类）' collate = utf8mb4_unicode_ci;

create index idx_parent_id
    on category (parent_id);

create index idx_sort
    on category (sort);

create index idx_status
    on category (status);

create table chat_message
(
    id           bigint                             not null comment '主键ID'
        primary key,
    from_user_id bigint                             not null comment '发送者ID (关联 sys_user.id)',
    to_user_id   bigint                             not null comment '接收者ID (关联 sys_user.id)',
    content      text                               not null comment '消息内容 (文本或 JSON 格式)',
    msg_type     tinyint  default 0                 null comment '消息类型: 0-文本, 1-图片, 2-商品卡片, 3-语音',
    product_id   bigint                             null comment '关联商品ID (可选)',
    is_read      tinyint  default 0                 null comment '是否已读: 0-未读, 1-已读',
    create_time  datetime default CURRENT_TIMESTAMP null comment '发送时间'
)
    comment '实时聊天消息记录表';

create index idx_from_to
    on chat_message (from_user_id, to_user_id);

create index idx_to_from
    on chat_message (to_user_id, from_user_id);

create table chat_session
(
    id               bigint                                 not null comment '主键ID'
        primary key,
    user_id          bigint                                 not null comment '用户ID (较小值)',
    contact_id       bigint                                 not null comment '联系人ID (较大值)',
    last_msg_content varchar(500) default ''                null comment '最后一条消息摘要',
    last_msg_time    datetime     default CURRENT_TIMESTAMP null comment '最后一条消息时间',
    unread_count_a   int          default 0                 null comment 'user_id 的未读数',
    unread_count_b   int          default 0                 null comment 'contact_id 的未读数',
    update_time      datetime     default CURRENT_TIMESTAMP null on update CURRENT_TIMESTAMP comment '更新时间',
    constraint uk_user_contact
        unique (user_id, contact_id)
)
    comment '聊天会话列表表';

create table collection
(
    id          bigint auto_increment comment '收藏ID（主键）'
        primary key,
    user_id     bigint                             not null comment '关联用户ID（外键）',
    product_id  bigint                             not null comment '关联商品ID（外键）',
    create_time datetime default CURRENT_TIMESTAMP not null comment '收藏时间',
    constraint uk_user_product
        unique (user_id, product_id)
)
    comment '商品收藏表' collate = utf8mb4_unicode_ci;

create index fk_collection_product
    on collection (product_id);

create index idx_create_time
    on collection (create_time);

create index idx_user_id
    on collection (user_id);

create table `consult(unuseable)`
(
    id             bigint auto_increment comment '咨询ID（主键）'
        primary key,
    user_id        bigint                                                  not null comment '关联用户ID（外键）',
    product_id     bigint                                                  null comment '关联商品ID（外键，可空，商品咨询）',
    content        varchar(500)                                            not null comment '咨询内容',
    reply_content  varchar(500)                                            null comment '回复内容',
    reply_admin_id bigint                                                  null comment '回复的管理员ID',
    status         enum ('UNHANDLED', 'HANDLED') default 'UNHANDLED'       not null comment '处理状态',
    create_time    datetime                      default CURRENT_TIMESTAMP not null comment '咨询时间',
    reply_time     datetime                                                null comment '回复时间'
)
    comment '用户咨询表' collate = utf8mb4_unicode_ci;

create index fk_consult_admin
    on `consult(unuseable)` (reply_admin_id);

create index idx_create_time
    on `consult(unuseable)` (create_time);

create index idx_product_id
    on `consult(unuseable)` (product_id);

create index idx_status
    on `consult(unuseable)` (status);

create index idx_user_id
    on `consult(unuseable)` (user_id);

create table factory_info
(
    id              int unsigned auto_increment comment '主键ID'
        primary key,
    image           varchar(200)                       null comment '单张背景图',
    factory_name    varchar(100)                       not null comment '工厂名称',
    introduction    text                               null comment '工厂简介',
    service_hotline varchar(20)                        null comment '服务热线',
    official_wechat varchar(50)                        null comment '官方微信',
    address         varchar(200)                       null comment '工厂地址',
    copyright_info  varchar(100)                       null comment '版权信息',
    create_time     datetime default CURRENT_TIMESTAMP null comment '创建时间',
    update_time     datetime default CURRENT_TIMESTAMP null on update CURRENT_TIMESTAMP comment '更新时间'
)
    comment '工厂基础信息表';

create table faq
(
    id          bigint auto_increment comment 'FAQ ID（主键）'
        primary key,
    question    varchar(200)                         not null comment '问题',
    answer      text                                 not null comment '答案',
    category    varchar(50)                          null comment '分类',
    sort        int        default 0                 not null comment '排序',
    status      tinyint(1) default 1                 not null comment '状态（0-禁用，1-启用）',
    create_time datetime   default CURRENT_TIMESTAMP not null comment '创建时间',
    update_time datetime   default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP comment '更新时间'
)
    comment '常见问题表' collate = utf8mb4_unicode_ci;

create index idx_sort
    on faq (sort);

create index idx_status
    on faq (status);

create table feedback
(
    id             bigint auto_increment comment '反馈ID（主键）'
        primary key,
    user_id        bigint                             not null comment '关联用户ID（外键）',
    content        varchar(500)                       not null comment '反馈内容',
    image_urls     varchar(1000)                      null comment '反馈图片URL（多个URL用英文逗号分隔，示例：url1,url2）',
    contact        varchar(50)                        null comment '联系方式',
    reply_content  varchar(500)                       null comment '回复内容',
    reply_admin_id bigint                             null comment '回复的管理员ID',
    status         tinyint  default 0                 not null comment '处理状态(0-未处理,1-已回复,2-已处理)',
    create_time    datetime default CURRENT_TIMESTAMP not null comment '反馈时间',
    reply_time     datetime                           null comment '回复时间'
)
    comment '用户反馈表' collate = utf8mb4_unicode_ci;

create index fk_feedback_admin
    on feedback (reply_admin_id);

create index idx_create_time
    on feedback (create_time);

create index idx_status
    on feedback (status);

create index idx_user_id
    on feedback (user_id);

create table notice
(
    id          bigint auto_increment comment '公告ID（主键）'
        primary key,
    title       varchar(100)                         not null comment '公告标题',
    content     text                                 not null comment '公告内容（富文本）',
    status      tinyint(1) default 1                 not null comment '状态（0-禁用，1-启用）',
    create_time datetime   default CURRENT_TIMESTAMP not null comment '创建时间',
    update_time datetime   default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP comment '更新时间'
)
    comment '系统公告表' collate = utf8mb4_unicode_ci;

create index idx_create_time
    on notice (create_time);

create index idx_status
    on notice (status);

create table operation_log
(
    id               bigint auto_increment comment '日志ID（主键）'
        primary key,
    admin_id         bigint                             not null comment '关联管理员ID（外键）',
    operation        varchar(100)                       not null comment '操作描述（如：新增商品、编辑订单）',
    operation_url    varchar(255)                       null comment '操作接口URL',
    operation_method varchar(10)                        null comment '请求方法（GET、POST、PUT、DELETE）',
    operation_ip     varchar(50)                        null comment '操作IP',
    request_params   text                               null comment '请求参数（JSON格式）',
    operation_time   datetime default CURRENT_TIMESTAMP not null comment '操作时间'
)
    comment '管理员操作日志表' collate = utf8mb4_unicode_ci;

create index idx_admin_id
    on operation_log (admin_id);

create index idx_operation_time
    on operation_log (operation_time);

create table `order`
(
    id                 bigint auto_increment comment '订单ID（主键）'
        primary key,
    order_no           varchar(50)                              not null comment '订单编号（唯一，格式：年月日+随机数）',
    user_id            bigint                                   not null comment '关联用户ID（外键）',
    address_id         bigint                                   not null comment '关联地址ID（外键）',
    total_goods_amount decimal(10, 2)                           not null comment '商品总价',
    freight            decimal(10, 2) default 0.00              not null comment '运费',
    total_amount       decimal(10, 2)                           not null comment '实付款金额（商品总价+运费）',
    status             int            default 1                 not null comment '订单状态 (''1-待支付'', ''2-待确认'', ''3-待发货'', ''4-待收货'', ''5-已完成'', ''6-已取消'', ''7-售后'')',
    pay_type           tinyint        default 0                 null comment '支付方式(''0-未支付'',''1-微信支付'', ''2-支付宝支付'')',
    pay_time           datetime                                 null comment '支付时间',
    deliver_time       datetime                                 null comment '发货时间',
    receive_time       datetime                                 null comment '确认收货时间',
    cancel_time        datetime                                 null comment '取消时间',
    cancel_reason      varchar(255)                             null comment '订单取消原因（仅当status为CANCELLED时有效）',
    remark             varchar(500)                             null comment '订单备注（用户填写）',
    is_evaluate        tinyint        default 0                 not null comment '是否评价( 0-否 , 1-是 )',
    is_deleted         tinyint        default 0                 not null comment '是否删除( 0-未删除 , 1-已删除 )',
    logistics_company  varchar(50)                              null comment '物流公司',
    logistics_no       varchar(50)                              null comment '物流单号',
    create_time        datetime       default CURRENT_TIMESTAMP not null comment '创建时间',
    update_time        datetime       default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP comment '更新时间',
    constraint uk_order_no
        unique (order_no)
)
    comment '订单表' collate = utf8mb4_unicode_ci;

create index idx_address_id
    on `order` (address_id);

create index idx_create_time
    on `order` (create_time);

create index idx_pay_time
    on `order` (pay_time);

create index idx_status
    on `order` (status);

create index idx_user_id
    on `order` (user_id);

create table order_item
(
    id            bigint auto_increment comment '明细ID（主键）'
        primary key,
    order_id      bigint                             not null comment '关联订单ID（外键）',
    product_id    bigint                             not null comment '关联商品ID（外键）',
    spec_id       bigint                             not null comment '关联规格ID',
    product_name  varchar(100)                       not null comment '商品名称（下单时快照）',
    spec_text     varchar(100)                       null comment '规格描述（下单时快照）',
    product_image varchar(255)                       null comment '商品图片（下单时快照）',
    price         decimal(10, 2)                     not null comment '购买单价（下单时价格）',
    quantity      int                                not null comment '购买数量',
    subtotal      decimal(10, 2)                     not null comment '小计金额（price×quantity）',
    create_time   datetime default CURRENT_TIMESTAMP not null comment '创建时间'
)
    comment '订单明细表' collate = utf8mb4_unicode_ci;

create index fk_item_spec
    on order_item (spec_id);

create index idx_order_id
    on order_item (order_id);

create index idx_product_id
    on order_item (product_id);

create table order_tracking
(
    id               bigint auto_increment comment '物流跟踪 id(主键)'
        primary key,
    logistics_no     varchar(50)                        not null comment '物流单号',
    order_id         bigint                             not null comment '关联订单id',
    logistics_status tinyint  default 1                 not null comment '物流状态(1-揽收, 2-运输, 3-派送, 4-签收)',
    location         varchar(25)                        not null comment '所在地点',
    description      varchar(150)                       null,
    create_time      datetime default CURRENT_TIMESTAMP not null comment '创建时间(跟踪时间)',
    constraint order_tracking_one
        unique (logistics_no)
)
    comment '订单物流跟踪表';

create index order_tracking_order_id_index
    on order_tracking (order_id);

create table product
(
    id               bigint auto_increment comment '商品ID（主键）'
        primary key,
    category_id      bigint                                                  not null comment '关联分类ID（外键）',
    name             varchar(100)                                            not null comment '商品名称',
    sell_point       varchar(255)                                            null comment '商品卖点/简介',
    price            decimal(10, 2)                                          not null comment '基础价格（最低规格价格）',
    enterprise_price decimal(10, 2)                                          null comment '企业批量价格（有值则表示启用企业价）',
    stock            int          default 0                                  not null comment '总库存数量（所有规格库存之和）',
    cover_image      varchar(648) default '/static/images/empty-product.png' null comment '商品封面图URL',
    description      text                                                    null comment '商品详情（富文本）',
    view_count       int          default 0                                  not null comment '浏览量',
    sales_count      int          default 0                                  not null comment '销量',
    status           tinyint(1)   default 1                                  not null comment '状态（0-下架，1-上架）',
    create_time      datetime     default CURRENT_TIMESTAMP                  not null comment '创建时间',
    update_time      datetime     default CURRENT_TIMESTAMP                  not null on update CURRENT_TIMESTAMP comment '更新时间'
)
    comment '商品表' collate = utf8mb4_unicode_ci;

create index idx_category_id
    on product (category_id);

create index idx_create_time
    on product (create_time);

create index idx_name
    on product (name);

create index idx_product_category_id_id
    on product (category_id, id);

create index idx_status
    on product (status);

create table product_comment
(
    id                  bigint auto_increment comment '评论唯一ID（主键）'
        primary key,
    product_id          bigint                             not null comment '商品ID，关联商品表',
    product_spec_id     bigint                             not null comment '商品规格 id',
    product_spec_text   text                               null comment '商品规格简介文本',
    order_id            bigint                             null comment '订单ID，关联订单表',
    user_id             bigint                             not null comment '评论人用户ID',
    user_nickname       text                               not null comment '用户昵称',
    user_avatar         text                               not null comment '用户头像',
    parent_id           bigint   default 0                 not null comment '父评论ID：0=一级评论（直接评商品），>0=二级回复（对应本表的评论ID）',
    reply_user_id       bigint                             null comment '被回复人用户ID，二级回复专用，前端展示「回复@XXX」',
    reply_user_nickname text                               null comment '回复用户昵称',
    is_buyer            int      default 0                 null comment '是否为买家',
    is_anonymous        int      default 0                 null comment '是否匿名(0-1)',
    is_append_comment   int      default 0                 null comment '是否追评',
    is_good_review      int      default 0                 null comment '是否为好评',
    rating              tinyint  default 0                 not null comment '商品评分：1-5星（仅一级评论必填，二级回复默认0）',
    content             text                               not null comment '评论/回复内容',
    image_urls          text                               null comment '评论图片，JSON数组格式存储，例：["url1","url2"]',
    like_count          int      default 0                 not null comment '点赞总数，冗余字段，从Redis同步过来，用于排序展示',
    status              tinyint  default 0                 not null comment '审核状态：0=待审核，1=已通过，2=已驳回',
    create_time         datetime default CURRENT_TIMESTAMP not null comment '创建时间',
    update_time         datetime default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP comment '更新时间'
)
    comment '商品评论主表' collate = utf8mb4_unicode_ci;

create index idx_parent_id
    on product_comment (parent_id)
    comment '核心查询索引：查某条评论的所有二级回复';

create index idx_product_id
    on product_comment (product_id)
    comment '核心查询索引：查某商品的所有评论';

create index idx_user_id
    on product_comment (user_id)
    comment '辅助索引：查某用户发布的所有评论';

create table product_comment_append
(
    id              bigint auto_increment comment '追评唯一ID（主键）'
        primary key,
    comment_id      bigint                             not null comment '关联原评论ID（对应product_comment.id）',
    product_id      bigint                             not null comment '商品ID（冗余，关联商品表）',
    product_spec_id bigint                             not null comment '商品规格ID（冗余）',
    order_id        bigint                             null comment '订单ID（冗余，关联订单表）',
    user_id         bigint                             not null comment '追评人用户ID',
    content         text                               not null comment '追评内容',
    image_urls      text                               null comment '追评图片，JSON数组格式：["url1","url2"]',
    status          tinyint  default 0                 not null comment '审核状态：0=待审核，1=已通过，2=已驳回（同主评论表）',
    create_time     datetime default CURRENT_TIMESTAMP not null comment '追评创建时间',
    constraint uk_comment_id
        unique (comment_id) comment '唯一索引：确保一条原评论仅能有一次追评（符合拼夕夕规则）'
)
    comment '商品追评表（关联原评论）' collate = utf8mb4_unicode_ci;

create index idx_comment_id
    on product_comment_append (comment_id)
    comment '查某条原评论的追评信息';

create index idx_product_id
    on product_comment_append (product_id)
    comment '查某商品的所有追评';

create index idx_user_id
    on product_comment_append (user_id)
    comment '查某用户发布的所有追评';

create table product_image
(
    id          bigint auto_increment comment '图片ID（主键）'
        primary key,
    product_id  bigint                             not null comment '关联商品ID（外键）',
    image_url   varchar(255)                       not null comment '图片URL',
    sort        int      default 0                 not null comment '排序（数字越小越靠前）',
    create_time datetime default CURRENT_TIMESTAMP not null comment '创建时间'
)
    comment '商品图片表（支持多图）' collate = utf8mb4_unicode_ci;

create index idx_product_id
    on product_image (product_id);

create index idx_sort
    on product_image (sort);

create table product_search_keyword
(
    id          bigint unsigned auto_increment comment '主键ID'
        primary key,
    keyword     varchar(64)                                not null comment '搜索关键词，如：短袖T恤、无线耳机',
    is_hot      tinyint unsigned default '0'               not null comment '是否为热门推荐 0-否 1-是',
    is_show     tinyint unsigned default '1'               not null comment '是否展示 0-隐藏 1-展示（违规词可隐藏）',
    create_time datetime         default CURRENT_TIMESTAMP not null comment '首次搜索时间【仅创建时赋值，永不修改】',
    update_time datetime         default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP comment '更新时间【创建+更新时自动赋值】',
    constraint uk_keyword
        unique (keyword) comment '唯一索引：保证关键词唯一，核心业务依赖'
)
    comment '商品搜索关键词表' collate = utf8mb4_unicode_ci;

create table product_spec
(
    id               bigint auto_increment comment '规格ID（主键）'
        primary key,
    product_id       bigint                             not null comment '关联商品ID（外键）',
    spec_text        varchar(100)                       not null comment '规格描述（如：1.2m×0.8m/原木色）',
    price            decimal(10, 2)                     not null comment '规格单价',
    enterprise_price decimal(10, 2)                     null comment '企业批量价格（有值则表示启用）',
    stock            int      default 0                 not null comment '规格库存',
    create_time      datetime default CURRENT_TIMESTAMP not null comment '创建时间',
    update_time      datetime default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP comment '更新时间'
)
    comment '商品规格表' collate = utf8mb4_unicode_ci;

create index idx_product_id
    on product_spec (product_id);

create table sys_permission
(
    id          bigint auto_increment comment '主键ID'
        primary key,
    perm_code   varchar(100)                       not null comment '权限编码（唯一，三级结构：模块:功能:操作）',
    perm_name   varchar(50)                        not null comment '权限名称',
    perm_type   tinyint  default 2                 not null comment '权限类型 1-菜单权限 2-按钮/接口权限',
    parent_id   bigint   default 0                 not null comment '父权限ID（0为顶级）',
    sort        int      default 0                 not null comment '排序（前端展示）',
    is_enable   tinyint  default 1                 not null comment '是否启用 1-启用 0-禁用',
    create_time datetime default CURRENT_TIMESTAMP not null comment '创建时间',
    constraint uk_perm_code
        unique (perm_code)
)
    comment '系统权限表（电商三级）' collate = utf8mb4_unicode_ci;

create index idx_is_enable_perm
    on sys_permission (is_enable, perm_code)
    comment '联合索引：过滤+查询';

create index idx_parent_id
    on sys_permission (parent_id);

create table sys_role
(
    id          bigint auto_increment comment '主键ID'
        primary key,
    role_code   varchar(50)                        not null comment '角色编码（唯一，Shiro规范：ROLE_开头）',
    role_name   varchar(50)                        not null comment '角色名称',
    sort        int      default 0                 not null comment '排序（前端展示）',
    is_enable   tinyint  default 1                 not null comment '是否启用 1-启用 0-禁用',
    create_time datetime default CURRENT_TIMESTAMP not null comment '创建时间',
    constraint uk_role_code
        unique (role_code)
)
    comment '系统角色表' collate = utf8mb4_unicode_ci;

create index idx_is_enable_code
    on sys_role (is_enable, role_code)
    comment '联合索引：过滤+查询';

create table sys_role_permission
(
    id      bigint auto_increment comment '主键ID'
        primary key,
    role_id bigint not null comment '关联角色ID',
    perm_id bigint not null comment '关联权限ID',
    constraint uk_role_perm
        unique (role_id, perm_id) comment '唯一索引：避免角色重复绑定同一权限'
)
    comment '角色-权限关联表' collate = utf8mb4_unicode_ci;

create index idx_perm_id
    on sys_role_permission (perm_id);

create index idx_role_id
    on sys_role_permission (role_id)
    comment '核心索引：按角色查权限';

create table sys_user
(
    id               bigint auto_increment comment '主键ID'
        primary key,
    username         varchar(50)                                              not null comment '登录名 ',
    password         varchar(60)                                              not null comment '密码（JBCrypt加密，固定60位）',
    nickname         varchar(100) default ''                                  null comment '微信openid（小程序唯一标识）',
    avatar           varchar(255) default '/static/images/default-avatar.png' not null comment '头像地址',
    phone            varchar(20)                                              null comment '手机号',
    openid           varchar(100)                                             null comment '微信openid（小程序唯一标识）',
    user_type        tinyint      default 3                                   not null comment '电商用户类型 1-系统管理员 2-普通管理员 3-普通买家 ',
    is_enable        tinyint      default 1                                   not null comment '是否启用 1-启用 0-禁用（禁用后无法登录）',
    first_login_time datetime                                                 null comment '第一次登录时间',
    last_login_time  datetime                                                 null comment '最近登录时间',
    create_time      datetime     default CURRENT_TIMESTAMP                   not null comment '创建时间',
    update_time      datetime     default CURRENT_TIMESTAMP                   not null on update CURRENT_TIMESTAMP comment '更新时间',
    constraint sys_openid
        unique (openid),
    constraint uk_username
        unique (username)
)
    comment '系统用户表（电商全角色）' collate = utf8mb4_unicode_ci;

create index idx_user_type
    on sys_user (user_type);

create table sys_user_role
(
    id      bigint auto_increment comment '主键ID'
        primary key,
    user_id bigint not null comment '关联用户ID',
    role_id bigint not null comment '关联角色ID',
    constraint uk_user_role
        unique (user_id, role_id) comment '唯一索引：避免用户重复绑定同一角色'
)
    comment '用户-角色关联表' collate = utf8mb4_unicode_ci;

create index idx_role_id
    on sys_user_role (role_id);

create index idx_user_id
    on sys_user_role (user_id)
    comment '核心索引：按用户查角色';


