module Api
  class UserCategoriesController < ActionController::API
    # POST /api/user_categories
    # body: { user_id: 1, category_slugs: ['it','web'] } or { user_id:1, category_ids: [1,2] }
    def create
      user = User.find_by(id: params[:user_id])
      return render(json: { error: 'user not found' }, status: :not_found) unless user

      slugs = Array(params[:category_slugs]).map(&:to_s).reject(&:blank?)
      ids = Array(params[:category_ids]).map(&:to_i).reject(&:zero?)

      categories = if slugs.any?
        Category.where(slug: slugs)
      elsif ids.any?
        Category.where(id: ids)
      else
        []
      end

      created = 0
      categories.each do |cat|
        uc = UserCategory.find_or_initialize_by(user: user, category: cat)
        if uc.new_record?
          uc.save
          created += 1
        end
      end

      render json: { ok: true, created: created, total: user.categories.count }
    rescue => e
      Rails.logger.error("user_categories#create error: #{e.message}\n#{e.backtrace.join("\n")}")
      render json: { error: 'internal error' }, status: :internal_server_error
    end
  end
end
