package com.expenzo.app;

import android.app.Notification;
import android.content.Intent;
import android.os.Bundle;
import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;
import androidx.localbroadcastmanager.content.LocalBroadcastManager;

public class NotificationListener extends NotificationListenerService {

    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        String packageName = sbn.getPackageName();

        if (isPaymentApp(packageName)) {
            Notification notification = sbn.getNotification();
            Bundle extras = notification.extras;
            
            String title = extras.getString(Notification.EXTRA_TITLE, "");
            String text = extras.getString(Notification.EXTRA_TEXT, "");
            String combinedText = title + " " + text;

            if (isTransaction(combinedText)) {
                Intent localIntent = new Intent("NEW_TRANSACTION_EVENT");
                localIntent.putExtra("source", "NOTIFICATION");
                localIntent.putExtra("text", combinedText);
                localIntent.putExtra("sender", packageName);
                LocalBroadcastManager.getInstance(this).sendBroadcast(localIntent);
            }
        }
    }

    private boolean isPaymentApp(String packageName) {
        return "com.google.android.apps.nbu.paisa.user".equals(packageName) ||
               "com.phonepe.app".equals(packageName) ||
               "net.one97.paytm".equals(packageName);
    }

    private boolean isTransaction(String text) {
        String lowerText = text.toLowerCase();
        // Look for basic transaction words. Filter out 'request' specifically so we don't count pending requests.
        return (lowerText.contains("paid") || lowerText.contains("received") || text.contains("₹") || lowerText.contains("rs.")) && 
               !lowerText.contains("request") && !lowerText.contains("failed");
    }
}
