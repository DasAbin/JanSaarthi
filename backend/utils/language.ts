export function languageInstruction(language: string): string {
  const code = (language || "en").toLowerCase();
  switch (code) {
    case "hi":
      return "Respond in Hindi (हिंदी में जवाब दें).";
    case "mr":
      return "Respond in Marathi (मराठी मध्ये उत्तर द्या).";
    case "kn":
      return "Respond in Kannada (ಕನ್ನಡದಲ್ಲಿ ಉತ್ತರಿಸಿ).";
    case "ta":
      return "Respond in Tamil (தமிழில் பதில் அளிக்கவும்).";
    case "te":
      return "Respond in Telugu (తెలుగులో సమాధానం ఇవ్వండి).";
    case "ml":
      return "Respond in Malayalam (മലയാളത്തിൽ മറുപടി നൽകുക).";
    case "bn":
      return "Respond in Bengali (বাংলায় উত্তর দিন)।";
    case "gu":
      return "Respond in Gujarati (ગુજરાતીમાં જવાબ આપો).";
    case "pa":
      return "Respond in Punjabi (ਪੰਜਾਬੀ ਵਿੱਚ ਜਵਾਬ ਦਿਓ).";
    case "or":
      return "Respond in Odia (ଓଡ଼ିଆରେ ଉତ୍ତର ଦିଅ).";
    default:
      return "Respond in simple English.";
  }
}

