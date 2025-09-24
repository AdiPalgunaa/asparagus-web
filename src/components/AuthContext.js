"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import {
  auth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from "@/lib/firebase";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const isAdmin = firebaseUser.email.includes("admin");
        const petaniId = firebaseUser.email.includes("petani1")
          ? 1
          : firebaseUser.email.includes("petani2")
          ? 2
          : firebaseUser.email.includes("petani3")
          ? 3
          : 1;

        const userData = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          role: isAdmin ? "admin" : "petani",
          name: isAdmin ? "Administrator" : `Petani ${petaniId}`,
          petaniId: isAdmin ? null : petaniId,
        };

        setUser(userData);
      } else {
        setUser(null);
      }
      setLoading(false);
      setAuthChecked(true);
    });

    return unsubscribe;
  }, []);

  const login = async (email, password, rememberMe = false) => {
    try {
      // Set persistence berdasarkan pilihan "Ingat Saya"
      if (rememberMe) {
        await setPersistence(auth, browserLocalPersistence);
      } else {
        await setPersistence(auth, browserSessionPersistence);
      }

      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const firebaseUser = userCredential.user;

      const isAdmin = email.includes("admin");
      const petaniId = email.includes("petani1")
        ? 1
        : email.includes("petani2")
        ? 2
        : email.includes("petani3")
        ? 3
        : 1;

      const userData = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        role: isAdmin ? "admin" : "petani",
        name: isAdmin ? "Administrator" : `Petani ${petaniId}`,
        petaniId: isAdmin ? null : petaniId,
      };

      setUser(userData);
      return { success: true, user: userData };
    } catch (error) {
      console.error("Login error:", error.code, error.message);
      return { success: false, error: error.code };
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const value = {
    user,
    login,
    logout,
    loading,
    authChecked, // Tambahkan ini untuk mengetahui kapan auth sudah dicek
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}