require 'net/http'
require 'uri'
require 'json'

class TranslationService
  # Translate text to target language using configured provider.
  # Currently supports: 'libre' (default) via libretranslate.com
  # env:
  #  TRANSLATE_PROVIDER - 'libre' (default)
  #  TRANSLATE_API_KEY - optional API key for provider

  def self.translate(text, target_lang, source_lang = 'auto')
    return '' if text.nil? || text.to_s.strip.empty?

    provider = (ENV['TRANSLATE_PROVIDER'] || 'libre').downcase
    case provider
    when 'libre'
      libre_translate(text, target_lang, source_lang)
    else
      raise "Unsupported translate provider: #{provider}"
    end
  rescue => e
    Rails.logger.error("TranslationService: translate error: #{e.class}: #{e.message}")
    ''
  end

  def self.libre_translate(text, target, source)
    uri = URI.parse(ENV['LIBRETRANSLATE_URL'] || 'https://libretranslate.com/translate')
    req = Net::HTTP::Post.new(uri)
    req['Content-Type'] = 'application/json'
    payload = { q: text.to_s, source: source, target: target, format: 'text' }
    # include API key if configured (some instances require it)
    api_key = ENV['TRANSLATE_API_KEY']
    payload[:api_key] = api_key if api_key && !api_key.empty?
    req.body = payload.to_json

    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = uri.scheme == 'https'
    http.read_timeout = 15
    http.open_timeout = 8
    res = http.request(req)
    if res.is_a?(Net::HTTPSuccess)
      body = JSON.parse(res.body)
      # LibreTranslate returns { translatedText: '...' }
      return (body['translatedText'] || body['translation'] || '').to_s
    else
      Rails.logger.warn("TranslationService: libretranslate returned #{res.code}: #{res.body}")
      ''
    end
  end
end
