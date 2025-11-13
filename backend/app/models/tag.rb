class Tag < ApplicationRecord
  has_many :user_tags
  validates :name, presence: true, uniqueness: true
end
