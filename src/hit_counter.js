module.exports = (config) => {
    const count = (req, path) => {

    };

    const read = (path) => {
        return {
            hits: 0,
            visitors: 0,
        };
    };

    return {
        count: count,
        read: read,
    };
};
