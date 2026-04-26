export interface IOrderItem {
    name: string;
    qty: number;
    image: string;
    price: number;
    product: string;
    size?: string;
    color?: string;
    _id?: string;
}

export interface IShippingAddress {
    address: string;
    city: string;
    postalCode: string;
    country: string;
}

export interface IOrder {
    _id: string;
    user: string | { _id: string; name: string; email: string };
    orderItems: IOrderItem[];
    shippingAddress: IShippingAddress;
    paymentMethod: string;
    paymentResult?: {
        id: string;
        status: string;
        update_time: string;
        email_address: string;
    };
    itemsPrice: number;
    taxPrice: number;
    shippingPrice: number;
    totalPrice: number;
    isPaid: boolean;
    paidAt?: string;
    isDelivered: boolean;
    deliveredAt?: string;
    isDispatched: boolean;
    dispatchedAt?: string;
    shippedAt?: string;
    processingAt?: string;
    confirmedAt?: string;
    returnRequestedAt?: string;
    returnedAt?: string;
    orderStatus: string;
    createdAt: string;
    updatedAt: string;
}
