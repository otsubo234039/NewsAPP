class Category < ApplicationRecord
  has_many :user_categories, dependent: :destroy
  has_many :users, through: :user_categories

  validates :name, presence: true
  validates :slug, presence: true, uniqueness: true
end
