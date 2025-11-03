import { z } from "zod";

// Password validation schema
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");

// Check if password has been breached using Have I Been Pwned API (k-anonymity model)
export async function checkPasswordBreached(password: string): Promise<boolean> {
  try {
    // Hash the password with SHA-1
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-1", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("").toUpperCase();
    
    // Send only the first 5 characters (k-anonymity)
    const prefix = hashHex.slice(0, 5);
    const suffix = hashHex.slice(5);
    
    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
    if (!response.ok) {
      // If the API fails, don't block signup
      console.error("Failed to check breached passwords");
      return false;
    }
    
    const text = await response.text();
    const hashes = text.split("\n");
    
    // Check if our password hash suffix appears in the results
    for (const line of hashes) {
      const [hashSuffix, count] = line.split(":");
      if (hashSuffix === suffix) {
        return true; // Password has been breached
      }
    }
    
    return false; // Password is safe
  } catch (error) {
    console.error("Error checking breached passwords:", error);
    // Don't block signup if check fails
    return false;
  }
}

// Validate password with all requirements
export async function validatePassword(password: string): Promise<{ valid: boolean; error?: string }> {
  // Check basic requirements
  const result = passwordSchema.safeParse(password);
  if (!result.success) {
    return { valid: false, error: result.error.errors[0].message };
  }
  
  // Check for breached passwords
  const isBreached = await checkPasswordBreached(password);
  if (isBreached) {
    return { 
      valid: false, 
      error: "This password has been exposed in a data breach. Please choose a different password." 
    };
  }
  
  return { valid: true };
}
