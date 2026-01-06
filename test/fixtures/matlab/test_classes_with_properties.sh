classdef Name < dynamicprops
    properties
        % i am a comment
        name1
        name2
    end
    properties (Constant = true, SetAccess = protected)
        % i too am a comment
        matrix = [0, 1, 2];
        string = 'i am a string'
    end
    methods
        % i am also a comment
        function self = Name()
            % i am a comment inside a constructor
        end
    end
end