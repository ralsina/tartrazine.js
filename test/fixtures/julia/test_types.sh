Union{}
MyType{Nothing, Any}
f(::Union{T,S}) where S where T = 1
f(::T) where {T} = 1
f(::Type{<:T}) = 1
f(::AT) where AT <: AbstractArray{MyType,1} = 1
f(::Val{:named}) = 1
f(::typeof(sin)) = 1
MyInt <: Integer
Number >: MyInt
AT{T,1} <: B
B>:AT{T,1}
A <: f(B)
g(C) <: T