'use strict';

// Source: http://stackoverflow.com/questions/497790
var dates = {
  convert:function(d) {
    // Converts the date in d to a date-object. The input can be:
    //   a date object: returned without modification
    //  an array      : Interpreted as [year,month,day]. NOTE: month is 0-11.
    //   a number     : Interpreted as number of milliseconds
    //                  since 1 Jan 1970 (a timestamp)
    //   a string     : Any format supported by the javascript engine, like
    //                  "YYYY/MM/DD", "MM/DD/YYYY", "Jan 31 2009" etc.
    //  an object     : Interpreted as an object with year, month and date
    //                  attributes.  **NOTE** month is 0-11.
    return (
      d.constructor === Date ? d :
        d.constructor === Array ? new Date(d[0],d[1],d[2]) :
          d.constructor === Number ? new Date(d) :
            d.constructor === String ? new Date(d) :
              typeof d === "object" ? new Date(d.year,d.month,d.date) :
                NaN
    );
  },
  compare:function(a,b) {
    // Compare two dates (could be of any type supported by the convert
    // function above) and returns:
    //  -1 : if a < b
    //   0 : if a = b
    //   1 : if a > b
    // NaN : if a or b is an illegal date
    // NOTE: The code inside isFinite does an assignment (=).
    return (
      isFinite(a=this.convert(a).valueOf()) &&
      isFinite(b=this.convert(b).valueOf()) ?
        (a>b)-(a<b) :
        NaN
    );
  },
  inRange:function(d,start,end) {
    // Checks if date in d is between dates in start and end.
    // Returns a boolean or NaN:
    //    true  : if d is between start and end (inclusive)
    //    false : if d is before start or after end
    //    NaN   : if one or more of the dates is illegal.
    // NOTE: The code inside isFinite does an assignment (=).
    return (
      isFinite(d=this.convert(d).valueOf()) &&
      isFinite(start=this.convert(start).valueOf()) &&
      isFinite(end=this.convert(end).valueOf()) ?
        start <= d && d <= end :
        NaN
    );
  }
};

/**
 * Plugin that adds stat information about the resource to each document.
 *
 * @param schema
 * @constructor
 */
function StatPlugin (schema) {
  schema.add ({
    _stat: {
      /// The time/date the resource was created.
      created_at: {type: Date, required: true, default: Date.now},

      /// The time/date the resource was modified.
      updated_at: {type: Date}
    }
  });

  // We are always going to make sure the created_at timestamp appears in
  // the _stat sub-document.

  schema.pre ('save', function (next) {
    if (this.isNew) {
      // The document is newly created. Make sure we have the created_at
      // field in the document.
      if (!this._stat.created_at)
        this._stat.created_at = new Date ();
    }
    else {
      // The document is being updated. We need to always set the updated_at
      // field to the current date/time.
      this._stat.updated_at = new Date ();
    }

    next ();
  });

  function refreshUpdatedAt () {
    if (!this._update.$set) this._update.$set = {};
    this._update.$set["_stat.updated_at"] = new Date ();
  }

  // Middleware hooks for updating the document. When the document is
  // updated, we make sure to update the "updated_at" path.
  schema.pre ('findOneAndUpdate', refreshUpdatedAt);
  schema.pre ('update', refreshUpdatedAt);

  // Define helper methods for accessing the stats.

  schema.methods.getCreatedAt = function () {
    return this._stat.created_at;
  };

  schema.methods.getUpdatedAt = function () {
    return this._stat.updated_at;
  };

  schema.methods.isOriginal = function () {
    return this._stat.updated_at === undefined;
  };

  schema.methods.isOutdated = function (lastUpdateTime) {
    return this._stat.updated_at && dates.compare (this._stat.updated_at, lastUpdateTime) == 1;
  };
  
  // Index the fields in _stat. This will make it easier to search for documents
  // based on the corresponding timestamps.
  schema.path ('_stat.created_at').index (true);
  schema.path ('_stat.updated_at').index (true);
}

module.exports = StatPlugin;
