package com.expenzo.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.telephony.SmsMessage;
import androidx.localbroadcastmanager.content.LocalBroadcastManager;

public class SmsReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        if ("android.provider.Telephony.SMS_RECEIVED".equals(intent.getAction())) {
            Bundle bundle = intent.getExtras();
            if (bundle != null) {
                Object[] pdus = (Object[]) bundle.get("pdus");
                if (pdus != null) {
                    for (Object pdu : pdus) {
                        try {
                            SmsMessage smsMessage = SmsMessage.createFromPdu((byte[]) pdu);
                            String messageBody = smsMessage.getMessageBody();
                            String sender = smsMessage.getDisplayOriginatingAddress();

                            if (messageBody != null && isTransaction(messageBody)) {
                                Intent localIntent = new Intent("NEW_TRANSACTION_EVENT");
                                localIntent.putExtra("source", "SMS");
                                localIntent.putExtra("text", messageBody);
                                localIntent.putExtra("sender", sender);
                                LocalBroadcastManager.getInstance(context).sendBroadcast(localIntent);
                            }
                        } catch (Exception e) {
                            e.printStackTrace();
                        }
                    }
                }
            }
        }
    }

    private boolean isTransaction(String message) {
        String lowerMsg = message.toLowerCase();
        return lowerMsg.contains("debited") || 
               lowerMsg.contains("credited") || 
               lowerMsg.contains("upi") || 
               lowerMsg.contains("txn") || 
               lowerMsg.contains("rs.") || 
               message.contains("₹");
    }
}
