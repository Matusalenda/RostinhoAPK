package com.Rostinho.app;

import android.os.Bundle;
import android.os.CancellationSignal;
import android.os.Handler;
import android.os.Looper;
import android.os.ParcelFileDescriptor;
import android.print.PageRange;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintDocumentInfo;
import android.print.PrintManager;
import android.util.Base64;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeActivity;

import java.io.FileOutputStream;
import java.io.IOException;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Bridge bridge = getBridge();
        WebView webView = bridge.getWebView();

        webView.addJavascriptInterface(new PrintInterface(webView), "AndroidPrint");
    }

    public class PrintInterface {

        private final WebView webView;
        private final Handler mainHandler = new Handler(Looper.getMainLooper());

        PrintInterface(WebView webView) {
            this.webView = webView;
        }

        @JavascriptInterface
        public void print() {
            runOnUiThread(() -> {
                PrintManager printManager =
                        (PrintManager) getSystemService(PRINT_SERVICE);

                PrintDocumentAdapter printAdapter =
                        webView.createPrintDocumentAdapter("Rostinho");

                printManager.print(
                        "Rostinho",
                        printAdapter,
                        new PrintAttributes.Builder().build()
                );

                restoreWebViewFocus();
            });
        }

        @JavascriptInterface
        public void printPdf(String base64Pdf) {
            runOnUiThread(() -> {
                byte[] pdfBytes = Base64.decode(base64Pdf, Base64.DEFAULT);

                PrintManager printManager =
                        (PrintManager) getSystemService(PRINT_SERVICE);

                PrintAttributes attributes = new PrintAttributes.Builder()
                        .setMediaSize(PrintAttributes.MediaSize.ISO_A4)
                        .build();

                printManager.print(
                        "Rostinho",
                        new PdfPrintAdapter(pdfBytes),
                        attributes
                );

                restoreWebViewFocus();
            });
        }

        private void restoreWebViewFocus() {
            restoreWebViewFocus(500);
            restoreWebViewFocus(1500);
            restoreWebViewFocus(3000);
        }

        private void restoreWebViewFocus(long delayMs) {
            mainHandler.postDelayed(() -> {
                webView.requestFocus();
                webView.requestFocusFromTouch();
                webView.evaluateJavascript("window.focus();", null);
            }, delayMs);
        }
    }

    private static class PdfPrintAdapter extends PrintDocumentAdapter {

        private final byte[] pdfBytes;

        PdfPrintAdapter(byte[] pdfBytes) {
            this.pdfBytes = pdfBytes;
        }

        @Override
        public void onLayout(
                PrintAttributes oldAttributes,
                PrintAttributes newAttributes,
                CancellationSignal cancellationSignal,
                LayoutResultCallback callback,
                Bundle extras
        ) {
            if (cancellationSignal.isCanceled()) {
                callback.onLayoutCancelled();
                return;
            }

            PrintDocumentInfo info = new PrintDocumentInfo.Builder("Rostinho.pdf")
                    .setContentType(PrintDocumentInfo.CONTENT_TYPE_DOCUMENT)
                    .setPageCount(PrintDocumentInfo.PAGE_COUNT_UNKNOWN)
                    .build();

            callback.onLayoutFinished(info, true);
        }

        @Override
        public void onWrite(
                PageRange[] pages,
                ParcelFileDescriptor destination,
                CancellationSignal cancellationSignal,
                WriteResultCallback callback
        ) {
            try (FileOutputStream output = new FileOutputStream(destination.getFileDescriptor())) {
                output.write(pdfBytes);
                callback.onWriteFinished(new PageRange[]{PageRange.ALL_PAGES});
            } catch (IOException error) {
                callback.onWriteFailed(error.toString());
            }
        }
    }
}