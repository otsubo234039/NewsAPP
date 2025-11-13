class Api::V1::UserTagsController < ApplicationController
  def index
    user_id = params[:user_id] || 1
    user_tags = UserTag.where(user_id: user_id).includes(:tag)
    render json: user_tags.as_json(include: :tag)
  end

  def create
    user_id = params[:user_id] || 1
    tag_id = params[:tag_id]
    
    user_tag = UserTag.new(user_id: user_id, tag_id: tag_id)
    
    if user_tag.save
      render json: user_tag.as_json(include: :tag), status: :created
    else
      render json: { errors: user_tag.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    user_tag = UserTag.find_by(id: params[:id])
    
    if user_tag
      user_tag.destroy
      render json: { message: "Tag removed successfully" }
    else
      render json: { error: "UserTag not found" }, status: :not_found
    end
  end
end
