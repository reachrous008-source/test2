// ============================================================
// PRIME KITS STORE — store.js
// Core Firestore data layer
// ============================================================

import { db, storage } from './firebase-config.js';
import {
  collection, doc, getDocs, getDoc, addDoc, updateDoc,
  deleteDoc, query, where, orderBy, onSnapshot, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import {
  ref, uploadBytes, getDownloadURL, deleteObject
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

// ── COLLECTIONS ──────────────────────────────────────────────
export const COLS = {
  products:   'products',
  categories: 'categories',
  orders:     'orders',
  settings:   'settings',
  shipping:   'shipping'
};

// ══════════════════════════════════════════════════════════════
//  SETTINGS
// ══════════════════════════════════════════════════════════════

/** Get a single settings document by its ID (e.g. 'site', 'contact', 'socials') */
export async function getSettings(docId = 'site') {
  const snap = await getDoc(doc(db, COLS.settings, docId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/** Merge-update a settings document */
export async function updateSettings(docId, data) {
  await updateDoc(doc(db, COLS.settings, docId), { ...data, updatedAt: serverTimestamp() });
}

/** Live listener for settings */
export function onSettings(docId, callback) {
  return onSnapshot(doc(db, COLS.settings, docId), snap => {
    callback(snap.exists() ? { id: snap.id, ...snap.data() } : null);
  });
}

// ══════════════════════════════════════════════════════════════
//  CATEGORIES
// ══════════════════════════════════════════════════════════════

export async function getCategories() {
  const q = query(collection(db, COLS.categories), orderBy('order', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function addCategory(data) {
  return addDoc(collection(db, COLS.categories), { ...data, createdAt: serverTimestamp() });
}

export async function updateCategory(id, data) {
  return updateDoc(doc(db, COLS.categories, id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteCategory(id) {
  return deleteDoc(doc(db, COLS.categories, id));
}

export function onCategories(callback) {
  const q = query(collection(db, COLS.categories), orderBy('order', 'asc'));
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

// ══════════════════════════════════════════════════════════════
//  PRODUCTS
// ══════════════════════════════════════════════════════════════

export async function getProducts(filters = {}) {
  let q = collection(db, COLS.products);
  const constraints = [orderBy('createdAt', 'desc')];
  if (filters.category && filters.category !== 'all') {
    constraints.unshift(where('category', '==', filters.category));
  }
  if (filters.featured) {
    constraints.unshift(where('featured', '==', true));
  }
  q = query(q, ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getProduct(id) {
  const snap = await getDoc(doc(db, COLS.products, id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function addProduct(data, imageFiles = []) {
  const imageUrls = [];
  for (const file of imageFiles) {
    const url = await uploadImage(file, 'products');
    imageUrls.push(url);
  }
  return addDoc(collection(db, COLS.products), {
    ...data,
    images: imageUrls,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}

export async function updateProduct(id, data, newImageFiles = [], removedUrls = []) {
  // Upload new images
  const newUrls = [];
  for (const file of newImageFiles) {
    const url = await uploadImage(file, 'products');
    newUrls.push(url);
  }

  // Delete removed images from storage
  for (const url of removedUrls) {
    try {
      const imgRef = ref(storage, url);
      await deleteObject(imgRef);
    } catch (_) {}
  }

  // Merge images: keep existing (minus removed) + new
  const existing = (data.images || []).filter(u => !removedUrls.includes(u));
  const finalImages = [...existing, ...newUrls];

  return updateDoc(doc(db, COLS.products, id), {
    ...data,
    images: finalImages,
    updatedAt: serverTimestamp()
  });
}

export async function deleteProduct(id) {
  const product = await getProduct(id);
  if (product?.images) {
    for (const url of product.images) {
      try { await deleteObject(ref(storage, url)); } catch (_) {}
    }
  }
  return deleteDoc(doc(db, COLS.products, id));
}

export function onProducts(callback) {
  const q = query(collection(db, COLS.products), orderBy('createdAt', 'desc'));
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

// ══════════════════════════════════════════════════════════════
//  ORDERS
// ══════════════════════════════════════════════════════════════

export async function createOrder(orderData) {
  return addDoc(collection(db, COLS.orders), {
    ...orderData,
    status: 'pending',
    createdAt: serverTimestamp()
  });
}

export async function getOrders() {
  const q = query(collection(db, COLS.orders), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function updateOrderStatus(id, status) {
  return updateDoc(doc(db, COLS.orders, id), { status, updatedAt: serverTimestamp() });
}

export function onOrders(callback) {
  const q = query(collection(db, COLS.orders), orderBy('createdAt', 'desc'));
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

// ══════════════════════════════════════════════════════════════
//  SHIPPING AGENTS
// ══════════════════════════════════════════════════════════════

export async function getShippingAgents() {
  const snap = await getDocs(collection(db, COLS.shipping));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function addShippingAgent(data) {
  return addDoc(collection(db, COLS.shipping), data);
}

export async function updateShippingAgent(id, data) {
  return updateDoc(doc(db, COLS.shipping, id), data);
}

export async function deleteShippingAgent(id) {
  return deleteDoc(doc(db, COLS.shipping, id));
}

// ══════════════════════════════════════════════════════════════
//  IMAGE UPLOAD HELPER
// ══════════════════════════════════════════════════════════════

export async function uploadImage(file, folder = 'uploads') {
  const ext = file.name.split('.').pop();
  const name = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
  const imgRef = ref(storage, name);
  const snap = await uploadBytes(imgRef, file);
  return getDownloadURL(snap.ref);
}

// ══════════════════════════════════════════════════════════════
//  SEED DEFAULT SETTINGS (run once)
// ══════════════════════════════════════════════════════════════

export async function seedDefaultSettings() {
  const siteSnap = await getDoc(doc(db, COLS.settings, 'site'));
  if (!siteSnap.exists()) {
    await updateDoc(doc(db, COLS.settings, 'site'), {
      storeName: 'Prime Kits Store',
      announcement: '✦ FREE SHIPPING ON ORDERS OVER $50 · AUTHENTIC PREMIUM JERSEYS ✦',
      heroTitle: 'PRIME',
      heroSubtitle: 'Luxury streetwear & premium jerseys, crafted for those who move differently.',
      heroCta: 'SHOP NOW',
      bannerTitle: 'THE PRIME COLLECTION',
      bannerSubtitle: 'Limited edition drops. Only the finest cuts.',
      footerTagline: 'Premium streetwear for the bold.'
    }).catch(async () => {
      await addDoc(collection(db, COLS.settings), {}).then(() => {});
    });
  }
}
