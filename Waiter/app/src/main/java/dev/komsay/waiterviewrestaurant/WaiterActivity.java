package dev.komsay.waiterviewrestaurant;

import android.os.Bundle;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.GridLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import com.android.volley.Request;
import com.android.volley.RequestQueue;
import com.android.volley.toolbox.JsonObjectRequest;
import com.android.volley.toolbox.Volley;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import android.util.Log;
import androidx.appcompat.app.AlertDialog;

// 🚀 Correct custom imports
import dev.komsay.waiterviewrestaurant.MenuModel;
import dev.komsay.waiterviewrestaurant.MenuAdapter;

import java.util.ArrayList;
import java.util.List;


public class WaiterActivity extends AppCompatActivity {
    private RecyclerView recyclerView;
    private MenuAdapter menuAdapter;
    private final String API_BASE = "http://10.0.2.2:5000/";
    private List<MenuModel> menuItems = new ArrayList<>();
    private RequestQueue requestQueue;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_waiter);

        recyclerView = findViewById(R.id.recyclerView);
        recyclerView.setLayoutManager(new GridLayoutManager(this, 2));

        requestQueue = Volley.newRequestQueue(this);

        menuAdapter = new MenuAdapter(menuItems, menu -> showSeatDialog(menu));
        recyclerView.setAdapter(menuAdapter);

        fetchMenus();
    }

    private void fetchMenus() {
        String url = API_BASE + "/waiter/menu";
        Log.d("WaiterActivity", "🔄 Fetching menus from: " + url); // DEBUG: See the URL

        JsonObjectRequest request = new JsonObjectRequest(Request.Method.GET, url, null,
                response -> {
                    Log.d("WaiterActivity", "✅ SUCCESS: Response received: " + response.toString());
                    try {
                        JSONArray menus = response.getJSONArray("menus");
                        Log.d("WaiterActivity", "📋 Found " + menus.length() + " menu items");

                        menuItems.clear();
                        for (int i = 0; i < menus.length(); i++) {
                            JSONObject menu = menus.getJSONObject(i);
                            MenuModel menuItem = new MenuModel(
                                    menu.getInt("id"),
                                    menu.getString("name"),
                                    menu.getDouble("price"),
                                    menu.optString("image_url", "")
                            );
                            menuItems.add(menuItem);
                            Log.d("WaiterActivity", "➕ Added: " + menuItem.getName() + " - ₱" + menuItem.getPrice());
                        }
                        menuAdapter.notifyDataSetChanged();

                        if (menuItems.isEmpty()) {
                            Log.w("WaiterActivity", "⚠️ No menu items found - empty response");
                            showErrorDialog("No menu items available. Check if admin has added any items.");
                        }

                    } catch (JSONException e) {
                        Log.e("WaiterActivity", "❌ JSON Error: " + e.getMessage());
                        showErrorDialog("Failed to parse menu data: " + e.getMessage());
                    }
                },
                error -> {
                    Log.e("WaiterActivity", "❌ NETWORK ERROR: " + error.getMessage());

                    // Show detailed error to user
                    String errorMsg = "Failed to load menu";
                    if (error.networkResponse != null) {
                        errorMsg += "\nStatus: " + error.networkResponse.statusCode;
                    } else if (error.getMessage() != null) {
                        errorMsg += "\nDetails: " + error.getMessage();
                    }

                    Log.e("WaiterActivity", "Full error: " + errorMsg);
                    showErrorDialog(errorMsg);
                }
        );
        requestQueue.add(request);
    }

    // Add this helper method
    private void showErrorDialog(String message) {
        new AlertDialog.Builder(this)
                .setTitle("Loading Error")
                .setMessage(message)
                .setPositiveButton("Retry", (dialog, which) -> fetchMenus())
                .setNegativeButton("Cancel", null)
                .show();
    }

    private void showSeatDialog(MenuModel menu) {
        String[] seats = new String[20];
        for (int i = 0; i < 20; i++) {
            seats[i] = "Seat " + (i + 1);
        }

        new AlertDialog.Builder(this)
                .setTitle("Select Seat")
                .setItems(seats, (dialog, which) -> addOrder(menu, which + 1))
                .setNegativeButton("Cancel", null)
                .show();
    }


    private void addOrder(MenuModel menu, int seat) {
        String url = API_BASE + "/waiter/orders";

        try {
            JSONObject orderData = new JSONObject();
            JSONArray items = new JSONArray();
            JSONObject item = new JSONObject();
            item.put("menu_id", menu.getId());  // Use getter from MenuModel
            item.put("quantity", 1);
            items.put(item);
            orderData.put("items", items);
            orderData.put("seat", seat);

            JsonObjectRequest request = new JsonObjectRequest(Request.Method.POST, url, orderData,
                    response -> {
                        new AlertDialog.Builder(WaiterActivity.this)
                                .setTitle("Success")
                                .setMessage("Order added to Seat " + seat)
                                .setPositiveButton("OK", null)
                                .show();
                    },
                    error -> new AlertDialog.Builder(WaiterActivity.this)
                            .setTitle("Error")
                            .setMessage("Failed to add order")
                            .setPositiveButton("OK", null)
                            .show()
            );
            requestQueue.add(request);
        } catch (JSONException e) {
            Log.e("WaiterActivity", "JSON Error: " + e.getMessage());
        }
    }
}