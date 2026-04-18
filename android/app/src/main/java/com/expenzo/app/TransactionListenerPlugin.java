package com.expenzo.app;

import android.Manifest;
import android.content.BroadcastReceiver;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.provider.Settings;
import androidx.localbroadcastmanager.content.LocalBroadcastManager;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;

@CapacitorPlugin(
    name = "TransactionListener",
    permissions = {
        @Permission(
            alias = "sms",
            strings = {
                Manifest.permission.RECEIVE_SMS,
                Manifest.permission.READ_SMS
            }
        )
    }
)
public class TransactionListenerPlugin extends Plugin {

    private BroadcastReceiver receiver;

    @Override
    public void load() {
        super.load();
        receiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                JSObject ret = new JSObject();
                ret.put("source", intent.getStringExtra("source"));
                ret.put("text", intent.getStringExtra("text"));
                ret.put("sender", intent.getStringExtra("sender"));
                notifyListeners("transactionDetected", ret);
            }
        };
        LocalBroadcastManager.getInstance(getContext())
            .registerReceiver(receiver, new IntentFilter("NEW_TRANSACTION_EVENT"));
    }

    @Override
    protected void handleOnDestroy() {
        if (receiver != null) {
            LocalBroadcastManager.getInstance(getContext()).unregisterReceiver(receiver);
        }
        super.handleOnDestroy();
    }

    @PluginMethod
    public void checkNotificationAccess(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("granted", isNotificationAccessGranted());
        call.resolve(ret);
    }

    @PluginMethod
    public void requestNotificationAccess(PluginCall call) {
        if (!isNotificationAccessGranted()) {
            Intent intent = new Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
        }
        call.resolve();
    }

    private boolean isNotificationAccessGranted() {
        ComponentName cn = new ComponentName(getContext(), NotificationListener.class);
        String flat = Settings.Secure.getString(getContext().getContentResolver(), "enabled_notification_listeners");
        return flat != null && flat.contains(cn.flattenToString());
    }
}
