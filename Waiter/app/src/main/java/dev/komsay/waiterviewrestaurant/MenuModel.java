package dev.komsay.waiterviewrestaurant;

public class MenuModel {
    public int id;
    public String name;
    public double price;
    public String imageUrl;

    public MenuModel(int id, String name, double price, String imageUrl) {
        this.id = id;
        this.name = name;
        this.price = price;
        this.imageUrl = imageUrl;
    }
    public int getId() { return id; }
    public String getName() { return name; }
    public double getPrice() { return price; }
    public String getImageUrl() { return imageUrl; }

}
