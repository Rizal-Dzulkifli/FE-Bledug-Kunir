// Utility functions untuk validasi nomor telepon
export class PhoneValidationUtils {
  
  /**
   * Membersihkan nomor telepon dari karakter yang tidak diperbolehkan
   * Hanya memperbolehkan: angka, +, -, spasi, dan tanda kurung ()
   */
  static cleanPhoneNumber(value: string): string {
    return value.replace(/[^\d+\-\s()]/g, '');
  }

  /**
   * Validasi format nomor telepon
   * Minimal 8 digit angka (tanpa menghitung karakter pemformat)
   */
  static isValidPhoneNumber(phoneNumber: string): boolean {
    const digits = phoneNumber.replace(/[^\d]/g, '');
    return digits.length >= 8;
  }

  /**
   * Format nomor telepon Indonesia (opsional)
   * Mengkonversi 08xxx menjadi +62-8xxx
   */
  static formatIndonesianPhone(phoneNumber: string): string {
    let cleaned = phoneNumber.replace(/[^\d]/g, '');
    
    // Jika dimulai dengan 08, ganti dengan +628
    if (cleaned.startsWith('08')) {
      cleaned = '+62' + cleaned.substring(1);
    }
    // Jika dimulai dengan 8 (tanpa 0), tambahkan +62
    else if (cleaned.startsWith('8') && cleaned.length >= 9) {
      cleaned = '+62' + cleaned;
    }
    
    return cleaned;
  }

  /**
   * Validasi komprehensif dengan pesan error yang spesifik
   */
  static validatePhoneWithMessage(phoneNumber: string): { isValid: boolean; message: string } {
    if (!phoneNumber.trim()) {
      return { isValid: false, message: 'Nomor telepon wajib diisi' };
    }

    const cleaned = this.cleanPhoneNumber(phoneNumber);
    const digits = cleaned.replace(/[^\d]/g, '');

    if (digits.length < 8) {
      return { isValid: false, message: 'Nomor telepon minimal 8 digit angka' };
    }

    if (digits.length > 15) {
      return { isValid: false, message: 'Nomor telepon maksimal 15 digit angka' };
    }

    // Validasi format Indonesia (opsional - bisa diaktifkan jika diperlukan)
    const indonesianPattern = /^(\+62|62|0)[8-9][0-9]{6,}$/;
    const cleanedForPattern = cleaned.replace(/[\s\-()]/g, '');
    
    if (!indonesianPattern.test(cleanedForPattern)) {
      console.warn('Format nomor telepon Indonesia tidak standar:', cleanedForPattern);
      // Tidak return error, hanya warning
    }

    return { isValid: true, message: 'Valid' };
  }

  /**
   * Contoh penggunaan dalam React component
   */
  static getReactHandler() {
    return {
      // Untuk onChange input
      handlePhoneChange: (value: string, setState: (value: string) => void) => {
        const cleaned = PhoneValidationUtils.cleanPhoneNumber(value);
        setState(cleaned);
      },

      // Untuk validasi sebelum submit
      validateBeforeSubmit: (phoneNumber: string): boolean => {
        const validation = PhoneValidationUtils.validatePhoneWithMessage(phoneNumber);
        if (!validation.isValid) {
          console.error('Validasi nomor telepon gagal:', validation.message);
          return false;
        }
        return true;
      }
    };
  }
}

export default PhoneValidationUtils;