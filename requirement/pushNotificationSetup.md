# 🔔 推送通知完整配置指南

## 架构概览

```
Youth 表达兴趣
    ↓
数据库触发器创建 notification 记录
    ↓
Database Webhook 自动触发
    ↓
Edge Function 查询 push_token
    ↓
调用 Expo Push API
    ↓
用户手机收到推送
```

---

## ✅ 步骤 1：更新 Edge Function

你已经创建了 Edge Function，现在需要用新代码替换它：

1. 打开 Supabase Dashboard → **Edge Functions**
2. 找到 `send-push-notification` 函数
3. 用 `requirement/notificationEdgeFunction.txr` 中的新代码替换
4. 点击 **Deploy**

**新代码的改进：**
- ✅ 适配 Database Webhook 格式（`{ record: {...} }`）
- ✅ 检查用户是否启用推送通知（`push_enabled`）
- ✅ 返回 200 状态码避免 webhook 重试
- ✅ 更好的错误日志

---

## ✅ 步骤 2：创建 Database Webhook

1. 打开 Supabase Dashboard → **Database** → **Webhooks**
2. 点击 **Create a new hook**
3. 填写配置：

```
Name: send-push-on-notification
Table: notifications
Events: ☑️ INSERT (勾选)
Type: Supabase Edge Functions
Edge Function: send-push-notification
```

4. 点击 **Create webhook**

**工作原理：**
- 每当 `notifications` 表插入新记录时
- Webhook 自动调用 `send-push-notification` Edge Function
- Edge Function 读取通知内容并发送推送

---

## ✅ 步骤 3：确保数据库触发器正确

在 Supabase SQL Editor 运行（如果还没运行过）：

```sql
-- 1. 确保 notifications 表有正确字段
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS reference_id UUID,
ADD COLUMN IF NOT EXISTS reference_table TEXT;

-- 2. 确保触发器存在
CREATE TRIGGER trigger_application_notifications
AFTER INSERT OR UPDATE ON applications
FOR EACH ROW
EXECUTE FUNCTION handle_application_notifications();

CREATE TRIGGER trigger_message_notifications
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION handle_message_notifications();
```

**这些触发器会：**
- ✅ 自动创建 `notifications` 表记录
- ✅ Webhook 检测到新记录后自动调用 Edge Function
- ✅ Edge Function 发送推送通知

---

## ✅ 步骤 4：测试推送通知

### 4.1 检查 Push Token 是否已保存

```sql
-- 查看用户的 push token
SELECT 
    id, 
    full_name, 
    user_type,
    profile_data->>'push_token' as push_token,
    profile_data->>'push_enabled' as push_enabled
FROM users 
WHERE user_type IN ('youth', 'elderly')
ORDER BY created_at DESC;
```

**应该看到：**
```
push_token: ExponentPushToken[xxxxxx]
push_enabled: true
```

如果没有，说明：
1. 用户还没登录过
2. `useNotifications` hook 没有正确执行
3. 设备没有推送权限

### 4.2 手动创建通知测试

```sql
-- 手动插入一条通知（用你的真实 user_id）
INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    is_read
) VALUES (
    'YOUR_USER_ID_HERE',  -- 替换成你的 user ID
    'test',
    'Test Notification 🎉',
    'This is a test push notification!',
    false
);
```

**如果配置正确：**
- ✅ 你的手机会立即收到推送通知
- ✅ 标题：Test Notification 🎉
- ✅ 内容：This is a test push notification!

### 4.3 测试完整流程

1. **Youth 登录** → 检查 console log 确认 push token 已注册
2. **Youth 表达兴趣** → Elderly 应该收到推送
3. **Elderly 接受/拒绝** → Youth 应该收到推送
4. **点击推送** → 应该导航到相应页面

---

## 🐛 调试工具

### 查看最近的通知

```sql
SELECT 
    n.id,
    n.title,
    n.message,
    n.type,
    n.created_at,
    u.full_name as recipient_name,
    u.profile_data->>'push_token' as has_token
FROM notifications n
JOIN users u ON n.user_id = u.id
ORDER BY n.created_at DESC
LIMIT 10;
```

### 查看 Edge Function 日志

1. Supabase Dashboard → **Edge Functions**
2. 点击 `send-push-notification`
3. 查看 **Logs** 标签
4. 看是否有错误信息

### 检查 Webhook 状态

1. Supabase Dashboard → **Database** → **Webhooks**
2. 找到 `send-push-on-notification`
3. 查看 **Recent Invocations**
4. 看是否成功触发

---

## 📱 常见问题

### Q: 收不到推送通知？

**检查清单：**
1. ✅ Push token 已保存到 users 表？
2. ✅ `push_enabled` 是 `true`？
3. ✅ Edge Function 已部署？
4. ✅ Database Webhook 已创建？
5. ✅ 触发器已创建？
6. ✅ 手机有网络连接？
7. ✅ Expo Go 应用在后台运行？

### Q: Edge Function 报错 "No push token found"？

**原因：**
- 用户的 `profile_data` 没有 `push_token` 字段
- 或者 `push_enabled` 是 `false`

**解决：**
```sql
-- 检查用户数据
SELECT profile_data FROM users WHERE id = 'USER_ID';

-- 如果需要，手动设置（仅测试用）
UPDATE users 
SET profile_data = jsonb_set(
    COALESCE(profile_data, '{}'::jsonb),
    '{push_enabled}',
    'true'
)
WHERE id = 'USER_ID';
```

### Q: 推送通知收到了但点击没反应？

**检查：**
1. `useNotifications.ts` 的 `navigationHandler` 是否正确
2. Router navigation 路径是否正确
3. Console log 查看 `notification.request.content.data`

---

## 🎉 完成！

现在你的推送通知系统已经完全配置好了：

✅ **在应用端：**
- `useNotifications` hook 自动注册 push token
- 用户登录时自动启用推送
- 点击通知自动导航

✅ **在服务器端：**
- 数据库触发器自动创建通知
- Database Webhook 自动调用 Edge Function
- Edge Function 自动发送推送

✅ **完全符合 MVVM 架构：**
- View → ViewModel → Service → Repository → Database
- 每一层职责清晰
- 易于测试和维护

---

## 🔗 相关文件

- Edge Function: `requirement/notificationEdgeFunction.txr`
- Database Schema: `requirement/DBTable.txt`
- Notification Hook: `View/Mobile/hooks/useNotifications.ts`
- Notification Service: `Model/Service/CoreService/notificationService.ts`

npm install -g eas-cli

# 登录 Expo 账号
eas login

# 配置项目
eas build:configure

# 构建 Development Build（Android）
eas build --profile development --platform android

# 或者构建 iOS
eas build --profile development --platform ios