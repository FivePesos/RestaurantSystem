package dev.komsay.waiterviewrestaurant;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.TextView;
import androidx.recyclerview.widget.RecyclerView;
import com.bumptech.glide.Glide;
import java.util.List;

public class MenuAdapter extends RecyclerView.Adapter<MenuAdapter.MenuViewHolder> {

    private List<MenuModel> items;  // FIXED
    private OnItemClickListener listener;

    public interface OnItemClickListener {
        void onItemClick(MenuModel menu); // FIXED
    }

    public MenuAdapter(List<MenuModel> items, OnItemClickListener listener) { // FIXED
        this.items = items;
        this.listener = listener;
    }

    @Override
    public MenuViewHolder onCreateViewHolder(ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_menu, parent, false);
        return new MenuViewHolder(view);
    }

    @Override
    public void onBindViewHolder(MenuViewHolder holder, int position) {
        MenuModel menu = items.get(position); // FIXED
        holder.bind(menu, listener);
    }

    @Override
    public int getItemCount() {
        return items.size();
    }

    public static class MenuViewHolder extends RecyclerView.ViewHolder {
        private ImageView imageView;
        private TextView nameView;
        private TextView priceView;

        public MenuViewHolder(View itemView) {
            super(itemView);
            imageView = itemView.findViewById(R.id.menuImage);
            nameView = itemView.findViewById(R.id.menuName);
            priceView = itemView.findViewById(R.id.menuPrice);
        }

        public void bind(MenuModel menu, OnItemClickListener listener) {
            nameView.setText(menu.name);
            priceView.setText(String.format("₱%.2f", menu.price));

            if (menu.imageUrl != null && !menu.imageUrl.isEmpty()) {
                Glide.with(itemView.getContext())
                        .load(menu.imageUrl)
                        .into(imageView);
            }

            itemView.setOnClickListener(v -> listener.onItemClick(menu));
        }
    }
}
