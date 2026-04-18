package com.expenzo.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(TransactionListenerPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
