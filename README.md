# **Event Booking Web Application**

## **Overview**
This is a full-stack web application designed for event organizers and attendees. Organizers can list their events, and users can browse, book, and pay for events through a seamless interface. After booking, users receive an e-Pass for their events.
---
<img width="304" alt="Screenshot 2025-01-03 at 11 26 38 PM" src="https://github.com/user-attachments/assets/06be191c-7c08-4ec9-ab86-93dbe6a23031" />

---

## **Features**

### **Event Organizer Features**
- **Account Creation**: Organizers can create and manage accounts.
- **Event Management**: Create, edit, and delete events with detailed descriptions.
- **Dashboard**: View and manage bookings for listed events.

### **User Features**
- **Account Creation**: Users must create an account to book events.
- **Event Browsing**: Explore all events listed by organizers.
- **Booking System**:
  - Provide details: name, email, phone, ticket type (couple, stag, family).
  - Secure payment gateway integration.
- **e-Pass**: Generate an electronic pass with booking details after successful payment.

---

## **Tech Stack**

### **Frontend**
- **React.js**: For building dynamic user interfaces.
- **Redux**: State management.
- **React Router**: Navigation between pages.
- **Tailwind CSS**: Styling and responsive design.
- **NextUI**: Prebuilt UI components.

### **Backend**
- **Node.js**: Server-side JavaScript runtime.
- **Express.js**: Web framework for building REST APIs.
- **MongoDB**: NoSQL database for storing user, event, and booking data.
- **JWT (JSON Web Token)**: Authentication mechanism.

### **Payment Gateway**
- **Stripe** or **PayPal**: For secure online payments.

---

## **Installation and Setup**

### **Prerequisites**
1. Node.js (v14+)
2. MongoDB (Local or MongoDB Atlas)
3. Git

### **Clone the Repository**
```bash
git clone https://github.com/ranvsingh7/Event_Management.git
cd event-booking-app
