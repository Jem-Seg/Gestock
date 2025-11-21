/**
 * Configuration de sécurité et rate limiting pour les API
 */

// Map pour stocker les tentatives de connexion par IP
const loginAttempts = new Map<string, { count: number; resetTime: number }>();

// Configuration rate limiting
const RATE_LIMIT_CONFIG = {
  login: {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
  api: {
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
  },
};

/**
 * Vérifier le rate limit pour une IP donnée
 */
export function checkRateLimit(
  ip: string,
  type: 'login' | 'api' = 'api'
): { allowed: boolean; retryAfter?: number } {
  const config = RATE_LIMIT_CONFIG[type];
  const now = Date.now();
  const attempt = loginAttempts.get(ip);
  
  const maxLimit = 'maxAttempts' in config ? config.maxAttempts : config.maxRequests;

  if (!attempt || now > attempt.resetTime) {
    // Première tentative ou fenêtre expirée
    loginAttempts.set(ip, {
      count: 1,
      resetTime: now + config.windowMs,
    });
    return { allowed: true };
  }

  if (attempt.count >= maxLimit) {
    // Limite atteinte
    const retryAfter = Math.ceil((attempt.resetTime - now) / 1000);
    return { allowed: false, retryAfter };
  }

  // Incrémenter le compteur
  attempt.count += 1;
  return { allowed: true };
}

/**
 * Réinitialiser le rate limit pour une IP
 */
export function resetRateLimit(ip: string): void {
  loginAttempts.delete(ip);
}

/**
 * Nettoyer les anciennes entrées (à appeler périodiquement)
 */
export function cleanupRateLimits(): void {
  const now = Date.now();
  for (const [ip, attempt] of loginAttempts.entries()) {
    if (now > attempt.resetTime) {
      loginAttempts.delete(ip);
    }
  }
}

// Nettoyage automatique toutes les 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupRateLimits, 5 * 60 * 1000);
}

/**
 * Obtenir l'IP du client depuis la requête
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIp) {
    return realIp.trim();
  }
  
  return 'unknown';
}

/**
 * Sanitiser les données d'entrée pour prévenir XSS
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Supprimer < et >
    .trim();
}

/**
 * Valider un email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Valider un mot de passe fort
 */
export function isStrongPassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Le mot de passe doit contenir au moins 8 caractères');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins une majuscule');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins une minuscule');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins un chiffre');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Générer une réponse d'erreur sécurisée (sans détails sensibles)
 */
export function secureErrorResponse(
  error: unknown,
  devMode: boolean = process.env.NODE_ENV === 'development'
): { message: string; details?: unknown } {
  if (devMode) {
    return {
      message: 'Une erreur est survenue',
      details: error,
    };
  }

  // En production, ne pas exposer les détails
  return {
    message: 'Une erreur est survenue. Veuillez réessayer.',
  };
}
