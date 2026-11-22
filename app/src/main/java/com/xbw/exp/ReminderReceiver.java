package com.xbw.exp;

import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

import java.util.Calendar;

public class ReminderReceiver extends BroadcastReceiver {

    public static final int HOUR = 21;
    public static final int MINUTE = 30;
    // 渠道的 IMPORTANCE 建好就改不了，要升到 HIGH 只能换 id；
    // 旧 "daily" 渠道留在系统里无害，新装/升级后都用 daily_v2
    private static final String CHANNEL = "daily_v2";

    @Override
    public void onReceive(Context ctx, Intent intent) {
        NotificationManager nm = (NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null) return;

        if (Build.VERSION.SDK_INT >= 26 && nm.getNotificationChannel(CHANNEL) == null) {
            NotificationChannel ch = new NotificationChannel(
                    CHANNEL, "每日提醒", NotificationManager.IMPORTANCE_HIGH);
            ch.setDescription("每天 21:30 提醒记熟练度");
            ch.enableVibration(true);
            nm.createNotificationChannel(ch);
        }

        Intent open = new Intent(ctx, MainActivity.class);
        open.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        int f = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= 23) f |= PendingIntent.FLAG_IMMUTABLE;
        PendingIntent pi = PendingIntent.getActivity(ctx, 2, open, f);

        // 文案尽量带上今天还剩什么，别只发一句空话
        String title = "记熟练度";
        String text = "今天做过的，点一下记上";
        try {
            String raw = ctx.getSharedPreferences("xbw", Context.MODE_PRIVATE).getString("today", null);
            if (raw != null) {
                org.json.JSONObject o = new org.json.JSONObject(raw);
                int d = o.optInt("d", 0);
                int streak = o.optInt("s", 0);
                org.json.JSONArray left = o.optJSONArray("left");
                if (left != null && left.length() > 0) {
                    StringBuilder sb = new StringBuilder();
                    for (int i = 0; i < Math.min(3, left.length()); i++) {
                        if (i > 0) sb.append("、");
                        sb.append(left.getString(i));
                    }
                    if (left.length() > 3) sb.append(" 等 ").append(left.length()).append(" 项");
                    title = "今天还差 " + left.length() + " 项";
                    text = "还没记：" + sb + (d > 0 ? "（今天已 +" + d + "）" : "");
                } else if (left != null) {
                    title = "今天都记完了";
                    text = streak > 0 ? "连续 " + streak + " 天，明天见" : "明天见";
                }
            }
        } catch (Exception e) {
            // 数据没同步过或者格式坏了，用通用文案
        }

        Notification.Builder b = Build.VERSION.SDK_INT >= 26
                ? new Notification.Builder(ctx, CHANNEL)
                : new Notification.Builder(ctx);
        b.setSmallIcon(R.drawable.ic_stat)
                .setContentTitle(title)
                .setContentText(text)
                .setStyle(new Notification.BigTextStyle().bigText(text))
                .setContentIntent(pi)
                .setAutoCancel(true);
        nm.notify(1, b.build());

        // 精确闹钟不是重复闹钟，响完必须自己排下一天
        schedule(ctx);
    }

    public static void schedule(Context ctx) {
        AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;

        Intent i = new Intent(ctx, ReminderReceiver.class);
        int f = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= 23) f |= PendingIntent.FLAG_IMMUTABLE;
        PendingIntent pi = PendingIntent.getBroadcast(ctx, 1, i, f);

        Calendar c = Calendar.getInstance();
        c.set(Calendar.HOUR_OF_DAY, HOUR);
        c.set(Calendar.MINUTE, MINUTE);
        c.set(Calendar.SECOND, 0);
        c.set(Calendar.MILLISECOND, 0);
        if (c.getTimeInMillis() <= System.currentTimeMillis()) {
            c.add(Calendar.DAY_OF_MONTH, 1);
        }
        // 能拿到精确闹钟就用精确的：setInexactRepeating 在 Doze 下可能漂几十分钟
        boolean exact = Build.VERSION.SDK_INT < 31 || am.canScheduleExactAlarms();
        if (exact) {
            am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, c.getTimeInMillis(), pi);
        } else {
            am.setInexactRepeating(AlarmManager.RTC_WAKEUP, c.getTimeInMillis(),
                    AlarmManager.INTERVAL_DAY, pi);
        }
    }
}
