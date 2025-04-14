/**
 * Tarih formatını YYYY-MM-DD şeklinde döndürür
 * @param {Date} date - Formatlama yapılacak tarih
 * @returns {string} - Formatlanmış tarih
 */
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/**
 * Sayıyı insan okuyabilir formata dönüştürür
 * @param {number} num - Sayı
 * @returns {string} - Formatlanmış sayı
 */
function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/**
 * Dosya adını oluşturur
 * @param {string} prefix - Dosya adı ön eki
 * @param {string} ext - Dosya uzantısı
 * @returns {string} - Oluşturulan dosya adı
 */
function createFileName(prefix, ext = "txt") {
  const today = formatDate(new Date());
  return `${prefix}_${today}.${ext}`;
}

module.exports = {
  formatDate,
  formatNumber,
  createFileName,
};
